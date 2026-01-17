#!/usr/bin/env python3
"""Setup database tables and create admin user"""

from app.database import Base, engine, SessionLocal
from app.models import User, UserRole
from app.auth_util import get_password_hash

def setup():
    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created!")
    
    # Create admin user
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == 'omimo2208@gmail.com').first()
        if existing:
            existing.password_hash = get_password_hash('2208Omimo')
            existing.role = UserRole.ADMIN
            existing.is_active = True
            existing.is_verified = True
            db.commit()
            print("✅ Admin password updated!")
            print(f"   Email: omimo2208@gmail.com")
            print(f"   Password: 2208Omimo")
        else:
            admin = User(
                name='Admin',
                email='omimo2208@gmail.com',
                password_hash=get_password_hash('2208Omimo'),
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print("✅ Admin created!")
            print(f"   Email: omimo2208@gmail.com")
            print(f"   Password: 2208Omimo")
    finally:
        db.close()

if __name__ == "__main__":
    setup()
