from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import random
from app.database import get_db
from app.models import User, PasswordReset
from app.schemas import PasswordResetRequest, PasswordResetVerify, PasswordResetComplete
from app.security import hash_password
from app.email_service import send_password_reset_email

router = APIRouter(prefix="/api/admin/password-reset", tags=["Password Reset"])


def generate_code() -> str:
    """Generate 6-digit random code"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


@router.post("/request")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Request password reset code.
    - Find user by email
    - Generate and save 6-digit code
    - Send email with code
    """
    # Find user by email
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "Если пользователь существует, код будет отправлен на его email"}
    
    # Generate code
    code = generate_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Save to database
    reset_record = PasswordReset(
        email=user.email,
        phone=user.phone,
        code=code,
        expires_at=expires_at
    )
    db.add(reset_record)
    db.commit()
    
    # Send email
    email_sent = send_password_reset_email(user.email, user.full_name or user.email, code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Не удалось отправить email. Попробуйте позже."
        )
    
    return {"message": f"Код отправлен на email {user.email}"}


@router.post("/verify")
def verify_reset_code(data: PasswordResetVerify, db: Session = Depends(get_db)):
    """
    Verify password reset code.
    - Check code exists and not expired
    - Check code not used
    - Verify code matches
    """
    # Find the most recent unused code for this email
    reset = db.query(PasswordReset).filter(
        PasswordReset.email == data.email,
        PasswordReset.code == data.code,
        PasswordReset.is_used == False
    ).order_by(PasswordReset.created_at.desc()).first()
    
    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный код"
        )
    
    # Check if expired
    if reset.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код истёк. Запросите новый код."
        )
    
    return {"message": "Код подтверждён", "valid": True}


@router.post("/complete")
def complete_password_reset(data: PasswordResetComplete, db: Session = Depends(get_db)):
    """
    Complete password reset.
    - Verify code is valid
    - Hash new password (min 8 chars)
    - Update user password
    - Mark code as used
    """
    # Validate password length
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пароль должен быть минимум 8 символов"
        )
    
    # Find the most recent unused code for this email
    reset = db.query(PasswordReset).filter(
        PasswordReset.email == data.email,
        PasswordReset.code == data.code,
        PasswordReset.is_used == False
    ).order_by(PasswordReset.created_at.desc()).first()
    
    if not reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный код"
        )
    
    # Check if expired
    if reset.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Код истёк. Запросите новый код."
        )
    
    # Find user
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Update password
    user.password_hash = hash_password(data.new_password)
    
    # Mark code as used
    reset.is_used = True
    
    db.commit()
    
    return {"message": "Пароль успешно изменён"}
