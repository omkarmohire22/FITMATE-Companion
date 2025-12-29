#!/usr/bin/env python3
"""Reset admin password"""

from app.database import SessionLocal
from app.models import User
from app.auth_util import get_password_hash

db = SessionLocal()

# Find admin
admin = db.query(User).filter(User.email == "admin@fitmate.com").first()

if admin:
    print(f"Found admin: {admin.email}")
    print(f"Current name: {admin.name}")
    
    # Reset password
    new_password = "Admin@123"
    admin.password_hash = get_password_hash(new_password)
    db.commit()
    
    print(f"✅ Password reset to: {new_password}")
else:
    print("❌ Admin not found, creating...")
    admin = User(
        email="admin@fitmate.com",
        name="Admin",
        password_hash=get_password_hash("Admin@123"),
        role="ADMIN",
        is_active=True,
        is_verified=True
    )
    db.add(admin)
    db.commit()
    print("✅ Admin created with password: Admin@123")
