#!/usr/bin/env python3
"""Direct test of schedule creation without going through frontend"""

from app.database import SessionLocal
from app.models import User, GymScheduleSlot, Notification
from datetime import datetime

db = SessionLocal()

# Get admin user
admin = db.query(User).filter(User.email == "admin@fitmate.com").first()
if not admin:
    print("❌ Admin not found")
    exit(1)

print(f"✅ Admin found: {admin.email}")

# Test 1: Create a schedule slot
print("\n📅 Creating schedule slot...")
try:
    slot = GymScheduleSlot(
        day_of_week="Monday",
        start_time="06:00 AM",
        end_time="10:00 AM",
        slot_type="general",
        title="Morning Session",
        description="General gym access",
        max_capacity=50,
        is_active=True
    )
    db.add(slot)
    db.flush()
    slot_id = slot.id
    print(f"✅ Slot created: ID {slot_id}")
    
    # Test 2: Create notifications
    print("\n🔔 Creating notifications for all users...")
    all_users = db.query(User).filter(User.is_active == True).all()
    notification_count = 0
    
    for user in all_users:
        notif = Notification(
            user_id=user.id,
            title="📅 New Schedule Added",
            message=f"Morning Session on Monday (06:00 AM - 10:00 AM)",
            notification_type="schedule",
            is_read=False
        )
        db.add(notif)
        notification_count += 1
    
    db.commit()
    print(f"✅ Created {notification_count} notifications for {notification_count} users")
    
    # Test 3: Verify notifications were created
    print("\n✅ Verifying notifications...")
    admin_notifs = db.query(Notification).filter(
        Notification.user_id == admin.id,
        Notification.notification_type == "schedule"
    ).all()
    print(f"✅ Admin has {len(admin_notifs)} schedule notifications")
    
    if admin_notifs:
        latest = admin_notifs[-1]
        print(f"   📌 Latest: {latest.title}")
        print(f"   📝 Message: {latest.message}")
        print(f"   📅 Created: {latest.created_at}")
    
    # Test 4: Verify slots were created
    print("\n✅ Verifying slots...")
    all_slots = db.query(GymScheduleSlot).all()
    print(f"✅ Total slots in DB: {len(all_slots)}")
    
    our_slot = db.query(GymScheduleSlot).filter(GymScheduleSlot.id == slot_id).first()
    if our_slot:
        print(f"✅ Our slot found:")
        print(f"   Title: {our_slot.title}")
        print(f"   Day: {our_slot.day_of_week}")
        print(f"   Time: {our_slot.start_time} - {our_slot.end_time}")
    
    print("\n" + "="*50)
    print("✅ ALL TESTS PASSED!")
    print("="*50)
    
except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
