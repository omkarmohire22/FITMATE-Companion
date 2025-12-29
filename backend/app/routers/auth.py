# ==============================
# AUTH ROUTES (FULLY FIXED VERSION)
# ==============================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
from app.schemas import LoginRequest

from app.database import get_db
from app.models import User, UserRole, Trainer, AdminOTP
from app.auth_util import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    verify_token
)

router = APIRouter()


# =============== SCHEMAS ===============

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "TRAINEE"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TrainerLoginRequest(BaseModel):
    trainer_id: int
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# =============== REGISTER ===============

@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):

    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(400, "Email already exists")

    if len(data.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")

    role_enum = UserRole(data.role.upper())

    new_user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        password_hash=get_password_hash(data.password),
        role=role_enum,
        is_active=True,
        is_verified=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registered successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role.value
        }
    }


# =============== LOGIN ===============

@router.post("/login")
async def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    if not user.is_active:
        raise HTTPException(403, "Account disabled")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role.value
        }
    }


# =============== ADMIN LOGIN ===============

@router.post("/admin/login")
async def admin_login(data: LoginRequest, db: Session = Depends(get_db)):

    # 1. Check if user exists
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user:
        raise HTTPException(status_code=404, detail="Admin account does not exist")

    # 2. Check role
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="You are not an admin")

    # 3. Verify password
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect admin password")

    # 4. Create tokens
    access_token = create_access_token({"sub": str(user.id), "role": "ADMIN"})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": "ADMIN"
        }
    }



# =============== TRAINER LOGIN ===============

@router.post("/trainer/login")
async def trainer_login(data: TrainerLoginRequest, db: Session = Depends(get_db)):

    trainer = db.query(Trainer).filter(Trainer.id == data.trainer_id).first()

    if not trainer:
        raise HTTPException(404, "Trainer not found")

    user = trainer.user

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid password")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "role": user.role.value
        }
    }


# =============== PROFILE ===============

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):

    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified
    }


# =============== REFRESH TOKEN ===============

@router.post("/refresh")
async def refresh(data: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = verify_token(data.refresh_token, token_type="refresh")
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(401, "Invalid refresh token")

    new_access = create_access_token({"sub": str(user.id)})

    return {"access_token": new_access}


# =============== LOGOUT ===============

@router.post("/logout")
async def logout():
    return {"message": "Logged out"}


# =============== FORGOT PASSWORD ===============

import secrets

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Handle forgot password request.
    Generates a temporary password and returns it to the user.
    """
    user = db.query(User).filter(User.email == data.email.lower()).first()
    
    if not user:
        # Don't reveal if email exists or not (security best practice)
        return {
            "message": "If an account with this email exists, you will receive a password reset.",
            "note": "Check your email for instructions"
        }
    
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account has been deactivated. Contact your admin."
        )
    
    # Generate a strong temporary password
    temp_password = secrets.token_urlsafe(8)  # e.g., "a1B2c3D4_5E6f"
    hashed_password = get_password_hash(temp_password)
    
    # Update user password
    user.password_hash = hashed_password
    db.commit()
    
    return {
        "success": True,
        "message": "Password reset successful!",
        "temporary_password": temp_password,
        "instructions": "Use this temporary password to login. Please change it after logging in.",
        "note": "⚠️ This password is temporary. Make sure to save it as it won't be shown again."
    }


# =============== TEST ROUTE ===============

@router.get("/test")
async def test():
    return {"message": "Auth is working!"}
