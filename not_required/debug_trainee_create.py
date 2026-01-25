#!/usr/bin/env python3
import sys
sys.path.insert(0, '/c/Users/omkar/Documents/FitMate/backend')

from app.database import SessionLocal
from app.models import User, Trainee, MembershipPlan, Membership
from app.auth_util import get_password_hash
from datetime import datetime, timedelta
import secrets

db = SessionLocal()

try:
    print("Testing trainee creation logic...")
    
    # Step 1: Create user
    print("\n[1] Creating user...")
    new_user = User(
        email="testtraineefixing@fitmate.com",
        password_hash=get_password_hash("TestPass123"),
        name="Test Trainee",
        phone="1234567890",
        role="TRAINEE",
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"✓ User created: ID {new_user.id}")
    
    # Step 2: Create trainee profile
    print("\n[2] Creating trainee profile...")
    trainee = Trainee(
        user_id=new_user.id,
        trainer_id=None,
        date_of_birth=datetime.strptime("1995-05-15", "%Y-%m-%d").date(),
        gender="Male",
        address="123 Test St",
        emergency_contact_name="John Doe",
        emergency_contact_phone="9876543210",
        health_conditions="None",
        fitness_goals="Weight loss",
    )
    db.add(trainee)
    db.commit()
    db.refresh(trainee)
    print(f"✓ Trainee profile created: ID {trainee.id}")
    
    # Step 3: Check membership plan
    print("\n[3] Checking membership plan...")
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == 2).first()
    if plan:
        print(f"✓ Plan found: {plan.name}, duration: {plan.duration_months} months")
        
        # Step 4: Create membership
        print("\n[4] Creating membership...")
        membership = Membership(
            trainee_id=new_user.id,
            membership_type=plan.membership_type,
            start_date=datetime.utcnow().date(),
            end_date=(datetime.utcnow() + timedelta(days=plan.duration_months * 30)).date(),
            status="active",
        )
        db.add(membership)
        db.commit()
        print(f"✓ Membership created")
    else:
        print("✗ Plan not found")
    
    print("\n✅ All operations successful!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
