from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from fastapi.security import OAuth2PasswordRequestForm  
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app import models, schemas, security, auth, database
from app.phone_utils import normalize_phone, is_phone_number

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/login", response_model=dict)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),  
    db: Session = Depends(database.get_db)
):
    login_identifier = form_data.username  # This is now email or phone
    password = form_data.password
    
    # Check if remember_me is in the request
    remember_me = False
    if hasattr(form_data, 'scopes') and form_data.scopes:
        # Try to get remember_me from form data
        try:
            import json
            # Some clients send it in scope or we can use a custom header
            remember_me = False  # Default
        except:
            pass
    
    # Determine if it's phone or email
    user = None
    if is_phone_number(login_identifier):
        normalized = normalize_phone(login_identifier)
        if normalized:
            user = db.query(models.User).filter(models.User.phone == normalized).first()
    else:
        # Treat as email
        user = db.query(models.User).filter(models.User.email == login_identifier).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email/телефон или пароль"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован"
        )

    if not security.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email/телефон или пароль"
        )

    # Get client info
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", None)
    
    # Create session with tokens
    # Note: remember_me will be handled in a custom login endpoint
    tokens = auth.create_session_tokens(
        user_id=user.user_id,
        db=db,
        remember_me=False,  # Default, will be updated with custom endpoint
        ip_address=ip_address,
        user_agent=user_agent,
        device_info=None
    )

    return tokens

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.post("/login-with-remember", response_model=dict)
def login_with_remember(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    """Login with 'Remember Me' option for persistent sessions"""
    login_identifier = form_data.username
    password = form_data.password
    
    # Determine if it's phone or email
    user = None
    if is_phone_number(login_identifier):
        normalized = normalize_phone(login_identifier)
        if normalized:
            user = db.query(models.User).filter(models.User.phone == normalized).first()
    else:
        user = db.query(models.User).filter(models.User.email == login_identifier).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email/телефон или пароль"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Аккаунт деактивирован"
        )

    if not security.verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email/телефон или пароль"
        )

    # Get client info
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", None)
    
    # Create session with remember_me = True (30 days)
    tokens = auth.create_session_tokens(
        user_id=user.user_id,
        db=db,
        remember_me=True,
        ip_address=ip_address,
        user_agent=user_agent,
        device_info=None
    )

    return tokens


@router.post("/refresh", response_model=dict)
def refresh_token(
    request: Request,
    db: Session = Depends(database.get_db)
):
    """Refresh access token using refresh token"""
    # Get refresh token from header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided"
        )
    
    refresh_token = auth_header.split(" ")[1]
    
    try:
        # Decode refresh token
        payload = auth.jwt.decode(refresh_token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        # Check if refresh token exists in database
        refresh_token_hash = auth.hash_token(refresh_token)
        session = db.query(models.UserSession).filter(
            models.UserSession.refresh_token == refresh_token_hash,
            models.UserSession.is_active == True
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session not found or expired"
            )
        
        # Check if session has expired
        if session.expires_at < datetime.now(timezone.utc):
            session.is_active = False
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired"
            )
        
        # Get client info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent", None)
        
        # Determine if this was a remember_me session
        # Check if original session was > 24 hours (indicates remember_me)
        is_remember_me = (session.expires_at - session.created_at).total_seconds() > 86400
        
        # Create new session tokens
        new_tokens = auth.create_session_tokens(
            user_id=int(user_id),
            db=db,
            remember_me=is_remember_me,
            ip_address=ip_address,
            user_agent=user_agent,
            device_info=None
        )
        
        # Deactivate old session
        session.is_active = False
        db.commit()
        
        return new_tokens
        
    except auth.jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
def logout(
    request: Request,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Logout by deactivating current session"""
    # Get current token from header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        token_hash = auth.hash_token(token)
        
        # Deactivate session
        session = db.query(models.UserSession).filter(
            models.UserSession.token_hash == token_hash
        ).first()
        
        if session:
            session.is_active = False
            db.commit()
    
    return {"message": "Successfully logged out"}


@router.get("/sessions", response_model=list)
def get_user_sessions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all active sessions for current user"""
    sessions = db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user.user_id,
        models.UserSession.is_active == True
    ).all()
    
    return [
        {
            "id": s.id,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
            "device_info": s.device_info,
            "created_at": s.created_at,
            "expires_at": s.expires_at,
            "last_used_at": s.last_used_at,
            "is_current": True  # Would need to compare with current token
        }
        for s in sessions
    ]


@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Revoke a specific session"""
    session = db.query(models.UserSession).filter(
        models.UserSession.id == session_id,
        models.UserSession.user_id == current_user.user_id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    db.commit()
    
    return {"message": "Session revoked"}