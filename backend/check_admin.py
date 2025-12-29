#!/usr/bin/env python3
from app.database import SessionLocal
from app.models import User

db = SessionLocal()
admins = db.query(User).filter(User.role == 'ADMIN').all()

print("\n=== ADMIN USERS ===")
for admin in admins:
    print(f"Email: {admin.email}")
    print(f"Name: {admin.name}")
    print(f"Active: {admin.is_active}")
    print()

if not admins:
    print("No admin users found!")
    print("\nCreating default admin...")
    from app.auth_util import hash_password
    
    default_admin = User(
        email="admin@fitmate.com",
        name="Admin",
        password_hash=hash_password("Admin@123"),
        role="ADMIN",
        is_active=True,
        is_verified=True
    )
    db.add(default_admin)
    db.commit()
    print("✅ Default admin created: admin@fitmate.com / Admin@123")
