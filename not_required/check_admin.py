from backend.app.database import SessionLocal
from backend.app.models import User

db = SessionLocal()
user = db.query(User).filter(User.email == 'admin@fitmate.com').first()
if user:
    print(f"User found: {user.email}")
    print(f"Role: {user.role}")
    print(f"Role type: {type(user.role)}")
    print(f"Role value: {user.role.value if hasattr(user.role, 'value') else user.role}")
else:
    print("User not found")
db.close()
