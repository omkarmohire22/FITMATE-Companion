from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole
from app.auth_util import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user,
    verify_token,
)

router = APIRouter()

# ===========================
# SCHEMAS
# ===========================

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "trainee"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenUser(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_verified: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: TokenUser


class ProfileResponse(BaseModel):
    user: TokenUser


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ===========================
# HELPERS
# ===========================

def map_user_to_token_user(user: User) -> TokenUser:
    """Maps DB user → TokenUser (handles Enum or string)."""
    role = user.role.value if isinstance(user.role, UserRole) else user.role

    return TokenUser(
        id=user.id,
        name=user.name,
        email=user.email,
        role=role.lower(),
        is_verified=user.is_verified,
    )


# ===========================
# REGISTER
# ===========================

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):

    role_str = data.role.lower()
    if role_str not in ("trainee", "trainer", "admin"):
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be trainee, trainer, or admin",
        )

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")

    # bcrypt safe
    password = data.password[:72]

    new_user = User(
        name=data.name,
        email=data.email.lower(),
        password_hash=get_password_hash(password),
        role=UserRole(role_str),
        is_active=True,
        is_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role.value,
        },
    }


# ===========================
# NORMAL USER LOGIN
# ===========================

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    if not user.is_active:
        raise HTTPException(403, "Account inactive")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    token_user = map_user_to_token_user(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=token_user,
    )


# ===========================
# ADMIN LOGIN (IMPORTANT)
# ===========================

@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user:
        raise HTTPException(401, "Invalid admin credentials")

    # Normalize DB role for safety
    db_role = (
        user.role.value.lower()
        if isinstance(user.role, UserRole)
        else str(user.role).lower()
    )

    if db_role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin credentials required.",
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid admin credentials")

    if not user.is_active:
        raise HTTPException(403, "Admin account is disabled")

    access_token = create_access_token({"sub": str(user.id), "role": "admin"})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    token_user = map_user_to_token_user(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=token_user,
    )


# ===========================
# PROFILE
# ===========================

@router.get("/profile", response_model=ProfileResponse)
async def profile(current_user: User = Depends(get_current_user)):

    token_user = map_user_to_token_user(current_user)
    return ProfileResponse(user=token_user)


# ===========================
# REFRESH TOKEN
# ===========================

@router.post("/refresh")
async def refresh_token_endpoint(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    try:
        decoded = verify_token(payload.refresh_token, token_type="refresh")
        user_id = decoded.get("sub")

        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user or not user.is_active:
            raise HTTPException(401, "Invalid or inactive user")

        new_access_token = create_access_token({"sub": str(user.id)})

        return {"access_token": new_access_token, "token_type": "bearer"}

    except:
        raise HTTPException(401, "Invalid refresh token")


# ===========================
# LOGOUT
# ===========================

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
