import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database import SessionLocal
from backend.app.models import User, UserRole
from backend.app.auth_util import get_password_hash

def create_trainee():
    db = SessionLocal()
    email = "trainee@fitmate.com"
    name = "Trainee User"
    password = "trainee123"
    # Check if trainee exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print(f"Trainee already exists: {email}")
        return
    trainee = User(
        name=name,
        email=email,
        password_hash=get_password_hash(password),
        role=UserRole.TRAINEE,
        is_active=True,
        is_verified=True
    )
    db.add(trainee)
    db.commit()
    db.refresh(trainee)
    print(f"Trainee created: {email} / {password}")
    db.close()

if __name__ == "__main__":
    create_trainee()
