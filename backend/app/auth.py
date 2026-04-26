from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from fastapi.security import OAuth2PasswordBearer

from app import models, schemas, database, security
from app.security import verify_password

import os
import hashlib

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")

SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour for regular sessions
REMEMBER_ME_EXPIRE_DAYS = 30  # 30 days for "Remember Me"
REMEMBER_ME_EXPIRE_MINUTES = REMEMBER_ME_EXPIRE_DAYS * 24 * 60  # 43200 minutes

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


def create_session_tokens(
    user_id: int,
    db: Session,
    remember_me: bool = False,
    ip_address: str = None,
    user_agent: str = None,
    device_info: str = None
):
    """
    Create access token, refresh token, and store session in database.
    Returns dict with tokens and session info.
    """
    # Set expiration based on remember_me
    if remember_me:
        expires_delta = timedelta(minutes=REMEMBER_ME_EXPIRE_MINUTES)
        refresh_expires_delta = timedelta(days=REMEMBER_ME_EXPIRE_DAYS + 7)  # 37 days
    else:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_expires_delta = timedelta(days=7)  # 7 days
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user_id)},
        expires_delta=expires_delta
    )
    
    # Create refresh token
    refresh_payload = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": os.urandom(16).hex()  # Unique identifier
    }
    refresh_token = jwt.encode(
        {**refresh_payload, "exp": datetime.utcnow() + refresh_expires_delta},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    # Hash tokens for storage
    access_token_hash = hash_token(access_token)
    refresh_token_hash = hash_token(refresh_token)
    
    # Create session in database
    now = datetime.now(timezone.utc)
    session = models.UserSession(
        user_id=user_id,
        token_hash=access_token_hash,
        refresh_token=refresh_token_hash,
        ip_address=ip_address,
        user_agent=user_agent,
        device_info=device_info,
        expires_at=now + expires_delta
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": int(expires_delta.total_seconds()),
        "remember_me": remember_me,
        "session_id": session.id
    }

def get_current_user(
    db: Session = Depends(database.get_db),
    token: str = Depends(oauth2_scheme),
    request: Request = None
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Check if session exists and is active
    token_hash = hash_token(token)
    session = db.query(models.UserSession).filter(
        models.UserSession.token_hash == token_hash,
        models.UserSession.is_active == True
    ).first()
    
    if not session:
        raise credentials_exception
    
    # Check if session has expired
    now = datetime.now(timezone.utc)
    if session.expires_at < now:
        session.is_active = False
        db.commit()
        raise credentials_exception
    
    # Update last_used_at
    session.last_used_at = now
    db.commit()
    
    # Get user
    user = db.query(models.User).options(
        joinedload(models.User.permissions)
    ).filter(models.User.user_id == int(user_id)).first()
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user

