from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.dependencies import get_current_active_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    generate_reset_token,
    get_password_hash,
    hash_reset_token,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
)
from app.schemas.user import UserRead
from app.services.sns_client import publish_email_notification

router = APIRouter()
settings = get_settings()


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenPair:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is deactivated")
    
    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        role=user.role.value,
        must_reset_password=user.must_reset_password,
    )


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenPair:
    from app.core.security import decode_token
    try:
        claims = decode_token(payload.refresh_token, settings.jwt_refresh_secret_key)
        subject = claims.get("sub")
        if not subject:
            raise ValueError("No subject in token")
        user = db.get(User, int(subject))
        if not user or not user.is_active:
            raise ValueError("Invalid user")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    return TokenPair(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        role=user.role.value,
        must_reset_password=user.must_reset_password,
    )


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_active_user)) -> User:
    return current_user


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user and user.is_active:
        token = generate_reset_token()
        token_hash = hash_reset_token(token)
        expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(minutes=30)
        
        db_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False
        )
        db.add(db_token)
        db.commit()
        
        reset_link = f"{settings.frontend_url}/reset-password?token={token}"
        subject = "Password Reset Request"
        message = (
            f"Hello,\n\n"
            f"We received a request to reset your password. Click the link below to reset it:\n"
            f"{reset_link}\n\n"
            f"This link will expire in 30 minutes.\n"
            f"If you did not request a password reset, please ignore this email."
        )
        publish_email_notification(subject, message, email=user.email)
        
    return {"message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hash_reset_token(payload.token)
    db_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used == False,
        PasswordResetToken.expires_at > dt.datetime.now(dt.timezone.utc)
    ).first()
    
    if not db_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")
        
    user = db.get(User, db_token.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive or not found")
        
    user.hashed_password = get_password_hash(payload.new_password)
    user.must_reset_password = False
    db_token.used = True
    db.add(user)
    db.add(db_token)
    db.commit()
    return {"message": "Password reset successfully."}


@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is invalid")
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_reset_password = False
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully"}

