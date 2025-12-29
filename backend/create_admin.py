"""
Script to create an admin user in the database.
Run this after setting up the database.

Usage:
    python create_admin.py
"""
import sys
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal, engine
from backend.app.models import Base, User, UserRole
from backend.app.auth_util import get_password_hash

def create_admin(email=None, password=None, name=None):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        if not email:
            email = input("Enter admin email: ").strip()
        if not password:
            password = "admin123"
        if not name:
            name = input("Enter admin name: ").strip()

        if not all([email, password, name]):
            print("❌ All fields are required!")
            return

        # Check if user exists
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"User {email} already exists. Updating to admin...")
            existing.role = UserRole.ADMIN
            existing.password_hash = get_password_hash(password)
            existing.name = name
            db.commit()
            print(f"✅ User {email} updated to admin!")
            return

        # Create admin user
        admin_user = User(
            email=email,
            password_hash=get_password_hash(password),
            name=name,
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )

        db.add(admin_user)
        db.commit()

        print(f"✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        print(f"   You can now login at http://localhost:3002/admin-login")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) == 4:
        email = sys.argv[1]
        password = sys.argv[2]
        name = sys.argv[3]
        create_admin(email, password, name)
    else:
        create_admin()

