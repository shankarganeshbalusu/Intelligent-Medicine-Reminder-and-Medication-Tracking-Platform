from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # Hash password
    hashed_password = auth.get_password_hash(user_in.password)
    
    # Create user
    new_user = models.User(
        name=user_in.name,
        email=user_in.email,
        notification_email=user_in.email,
        password_hash=hashed_password,
        role=user_in.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials"
        )
    
    if not auth.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials"
        )
    
    # Generate JWT token
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }


import datetime
import secrets

@router.post("/google-login", response_model=schemas.Token)
def google_login(req: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    
    if not user:
        random_pw = secrets.token_urlsafe(16)
        hashed_password = auth.get_password_hash(random_pw)
        
        user = models.User(
            name=req.name,
            email=req.email,
            notification_email=req.email,
            password_hash=hashed_password,
            role=req.role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
        "name": user.name,
        "email": user.email
    }


@router.post("/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="A user with this email address does not exist."
        )
    
    token = secrets.token_hex(16)
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    
    db_token = models.PasswordResetToken(
        email=req.email,
        token=token,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    
    from app.email_worker import send_email_notification
    reset_link = f"http://localhost:5173/reset-password?token={token}&email={req.email}"
    
    subject = "🔑 PillSync: Password Reset Request"
    html_body = f"""
    <p>Hello <strong>{user.name}</strong>,</p>
    <p>We received a request to reset your password on the PillSync platform.</p>
    <p>Please click the link below to set a new password:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>This link will expire in 15 minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
    <p><em>PillSync Platform Support</em></p>
    """
    send_email_notification(user.email, subject, html_body)
    
    return {"status": "Password reset email sent."}


@router.post("/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    db_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token,
        models.PasswordResetToken.email == req.email
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
        
    if db_token.expires_at < datetime.datetime.utcnow():
        db.delete(db_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token has expired."
        )
        
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    user.password_hash = auth.get_password_hash(req.new_password)
    
    db.delete(db_token)
    db.commit()
    
    return {"status": "Password reset successfully."}

