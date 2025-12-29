
# Script to check and create a trainee user/profile in FitMate
import os
from dotenv import load_dotenv
load_dotenv()
from backend.app.database import SessionLocal
from backend.app.models import User, UserRole, Trainee
from backend.hash import get_password_hash

# --- CONFIGURE THESE ---
TRAINEE_EMAIL = "trainee1@example.com"
TRAINEE_PASSWORD = "trainee123"
TRAINEE_NAME = "Test Trainee"

# --- Connect to DB ---
db = SessionLocal()

# 1. List all users and their roles
print("All users:")
for user in db.query(User).all():
    print(f"ID: {user.id}, Email: {user.email}, Role: {user.role}")

# 2. Check if trainee user exists
user = db.query(User).filter(User.email == TRAINEE_EMAIL).first()
if not user:
    print(f"Creating new trainee user: {TRAINEE_EMAIL}")
    user = User(
        email=TRAINEE_EMAIL,
        password_hash=get_password_hash(TRAINEE_PASSWORD),
        name=TRAINEE_NAME,
        role=UserRole.TRAINEE,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
else:
    print(f"User already exists: {user.email} (ID: {user.id})")

# 3. Check if trainee profile exists
trainee_profile = db.query(Trainee).filter(Trainee.user_id == user.id).first()
if not trainee_profile:
    print(f"Creating trainee profile for user ID {user.id}")
    trainee_profile = Trainee(
        user_id=user.id,
        goal="Lose Weight",
        weight=70.0,
        height=175.0,
        target_weight=65.0,
        fitness_level="beginner"
    )
    db.add(trainee_profile)
    db.commit()
else:
    print(f"Trainee profile already exists for user ID {user.id}")

db.close()
print("Done.")
