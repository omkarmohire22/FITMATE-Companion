# ==============================
# AUTH UTIL (FINAL STABLE VERSION)
# ==============================

import os
from datetime import datetime, timedelta
from typing import Optional

from passlib.context import CryptContext
from jose import jwt, JWTError
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole


# ============================
# SECURITY CONFIG
# ============================

# 🚀 PBKDF2-SHA256 — FULL WINDOWS SUPPORT
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_THIS_SECRET")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# ============================
# PASSWORD HELPERS
# ============================

def get_password_hash(password: str) -> str:
    """Hash password using PBKDF2-SHA256."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # If hash format is invalid or unknown
        return False


# ============================
# TOKEN HELPERS
# ============================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str, token_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != token_type:
            raise HTTPException(401, "Invalid token type.")

        return payload

    except JWTError:
        raise HTTPException(401, "Invalid or expired token.")


# ============================
# CURRENT USER
# ============================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    payload = verify_token(token, token_type="access")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(401, "Invalid authentication token.")

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(401, "User not found.")

    if not user.is_active:
        raise HTTPException(403, "Account is disabled.")

    # Fix enum mismatch
    if isinstance(user.role, str):
        user.role = UserRole(user.role.upper())

    return user


# ============================
# ROLE GUARDS
# ============================

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    role_value = (
        current_user.role.value
        if isinstance(current_user.role, UserRole)
        else current_user.role
    )

    if role_value != UserRole.ADMIN.value:
        raise HTTPException(403, "Admin access required.")

    return current_user


def require_role(allowed_roles: list[str]):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        role_value = (
            current_user.role.value
            if isinstance(current_user.role, UserRole)
            else current_user.role
        )
        # Normalize both to uppercase for comparison
        allowed_roles_upper = [r.upper() for r in allowed_roles]
        if role_value.upper() not in allowed_roles_upper:
            raise HTTPException(403, "You do not have permission.")
        return current_user
    return dependency


def require_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.ADMIN:
        raise HTTPException(403, "Admins only.")
    return user


def require_trainer(user: User = Depends(get_current_user)):
    if user.role != UserRole.TRAINER:
        raise HTTPException(403, "Trainers only.")
    return user
