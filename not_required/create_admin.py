import sys
import os

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database import SessionLocal
from backend.app.models import User, UserRole
from backend.app.auth_util import get_password_hash

def create_admin():
    db = SessionLocal()
    
    try:
        # Check if admin exists
        existing_admin = db.query(User).filter(
            User.email == "admin@fitmate.com"
        ).first()
        
        if existing_admin:
            print("\n" + "=" * 60)
            print("❌ Admin already exists!")
            print(f"📧 Email: {existing_admin.email}")
            print(f"🆔 ID: {existing_admin.id}")
            print("=" * 60)
            
            # Reset password option
            reset = input("\nReset password? (y/n): ")
            if reset.lower() == 'y':
                existing_admin.password_hash = get_password_hash("admin123")
                db.commit()
                print("✅ Password reset to: admin123")
            return
        
        # Create new admin
        print("\n🔧 Creating admin user...")
        
        admin = User(
            name="Admin",
            email="admin@fitmate.com",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("\n" + "=" * 60)
        print("✅ ADMIN CREATED SUCCESSFULLY!")
        print("=" * 60)
        print(f"📧 Email: admin@fitmate.com")
        print(f"🔑 Password: admin123")
        print(f"🆔 ID: {admin.id}")
        print(f"🔐 Role: {admin.role.value}")
        print("=" * 60)
        print("\n✨ You can now login at: http://localhost:3003/admin-login\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n🚀 FitMate Pro - Admin Setup\n")
    create_admin()