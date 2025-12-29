
import sys
import os
import random
import string
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import SessionLocal
from app.models import User, Trainer, Trainee, UserRole, TrainerSchedule

client = TestClient(app)

def get_random_string(length=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def create_test_user(role="TRAINEE"):
    email = f"test_{role.lower()}_{get_random_string()}@example.com"
    password = "password123"
    name = f"Test {role.capitalize()}"
    
    response = client.post("/api/auth/register", json={
        "name": name,
        "email": email,
        "password": password,
        "role": role
    })
    assert response.status_code == 201
    return email, password, response.json()["user"]["id"]

def setup_trainer_profile(user_id):
    db = SessionLocal()
    try:
        trainer = Trainer(
            user_id=user_id,
            specialization="General Fitness",
            experience_years=5,
            certifications=["ACE", "NASM"]
        )
        db.add(trainer)
        db.commit()
        db.refresh(trainer)
        return trainer.id
    finally:
        db.close()

def setup_trainee_profile(user_id, trainer_id):
    db = SessionLocal()
    try:
        trainee = Trainee(
            user_id=user_id,
            trainer_id=trainer_id,
            fitness_level="beginner",
            goal="weight_loss"
        )
        db.add(trainee)
        db.commit()
        db.refresh(trainee)
        return trainee.id
    finally:
        db.close()

def login(email, password):
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert response.status_code == 200
    return response.json()["access_token"]

def run_tests():
    print("🚀 Starting Trainer Dashboard Feature Tests...")
    
    # 1. Setup Users
    print("\n1. Setting up test users...")
    trainer_email, trainer_pass, trainer_user_id = create_test_user("TRAINER")
    trainer_id = setup_trainer_profile(trainer_user_id)
    print(f"   Created Trainer: {trainer_email} (ID: {trainer_id})")
    
    trainee_email, trainee_pass, trainee_user_id = create_test_user("TRAINEE")
    trainee_id = setup_trainee_profile(trainee_user_id, trainer_id)
    print(f"   Created Trainee: {trainee_email} (ID: {trainee_id})")
    
    # 2. Login
    print("\n2. Logging in...")
    token = login(trainer_email, trainer_pass)
    headers = {"Authorization": f"Bearer {token}"}
    print("   Login successful")

    # 3. Test Dashboard Stats
    print("\n3. Testing Dashboard Stats...")
    resp = client.get("/api/trainer/dashboard", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"   ✅ GET /dashboard: {data}")
        assert "total_trainees" in data
    else:
        print(f"   ❌ GET /dashboard FAILED: {resp.status_code} - {resp.text}")

    # 4. Test Trainees List
    print("\n4. Testing Trainees List...")
    resp = client.get("/api/trainer/trainees", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"   ✅ GET /trainees: Found {len(data['trainees'])} trainees")
        assert len(data['trainees']) >= 1
        assert data['trainees'][0]['email'] == trainee_email
    else:
        print(f"   ❌ GET /trainees FAILED: {resp.status_code} - {resp.text}")

    # 5. Test Messages
    print("\n5. Testing Messages...")
    # Send
    msg_payload = {"message": "Hello from test script"}
    resp = client.post(f"/api/trainer/trainees/{trainee_id}/messages", json=msg_payload, headers=headers)
    if resp.status_code == 200:
        print(f"   ✅ POST /messages: Sent successfully")
    else:
        print(f"   ❌ POST /messages FAILED: {resp.status_code} - {resp.text}")
    
    # Get
    resp = client.get(f"/api/trainer/trainees/{trainee_id}/messages", headers=headers)
    if resp.status_code == 200:
        msgs = resp.json()
        print(f"   ✅ GET /messages: Found {len(msgs)} messages")
        assert len(msgs) >= 1
        assert msgs[-1]['message'] == "Hello from test script"
    else:
        print(f"   ❌ GET /messages FAILED: {resp.status_code} - {resp.text}")

    # 6. Test Schedule
    print("\n6. Testing Schedule...")
    # Create
    schedule_payload = {
        "day_of_week": 1, # Tuesday
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "is_available": True
        # trainer_id removed to test optionality
    }
    # Note: The endpoint expects TrainerScheduleRequest. Let's check schema if needed.
    # Based on code: day_of_week, start_time, end_time, is_available.
    
    resp = client.post("/api/trainer/schedule", json=schedule_payload, headers=headers)
    if resp.status_code == 200:
        print(f"   ✅ POST /schedule: Created successfully")
        schedule_id = resp.json().get("id")
    else:
        print(f"   ❌ POST /schedule FAILED: {resp.status_code} - {resp.text}")
        schedule_id = None

    # Get
    resp = client.get("/api/trainer/schedule", headers=headers)
    if resp.status_code == 200:
        sched = resp.json()
        print(f"   ✅ GET /schedule: Found {len(sched['schedule'])} slots")
    else:
        print(f"   ❌ GET /schedule FAILED: {resp.status_code} - {resp.text}")

    # Update
    if schedule_id:
        update_payload = {
            "day_of_week": 1,
            "start_time": "11:00:00",
            "end_time": "12:00:00",
            "is_available": False,
            "trainer_id": str(trainer_id)
        }
        resp = client.put(f"/api/trainer/schedule/{schedule_id}", json=update_payload, headers=headers)
        if resp.status_code == 200:
            print(f"   ✅ PUT /schedule: Updated successfully")
        else:
            print(f"   ❌ PUT /schedule FAILED: {resp.status_code} - {resp.text}")

        # Delete
        resp = client.delete(f"/api/trainer/schedule/{schedule_id}", headers=headers)
        if resp.status_code == 200:
            print(f"   ✅ DELETE /schedule: Deleted successfully")
        else:
            print(f"   ❌ DELETE /schedule FAILED: {resp.status_code} - {resp.text}")

    # 7. Test Attendance
    print("\n7. Testing Attendance...")
    # Mark
    attendance_payload = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "status": "present"
    }
    resp = client.post(f"/api/trainer/trainees/{trainee_id}/attendance/mark", json=attendance_payload, headers=headers)
    if resp.status_code == 200:
        print(f"   ✅ POST /attendance/mark: Marked successfully")
    else:
        print(f"   ❌ POST /attendance/mark FAILED: {resp.status_code} - {resp.text}")

    # Summary
    resp = client.get("/api/trainer/attendance/summary", headers=headers)
    if resp.status_code == 200:
        summary = resp.json()
        print(f"   ✅ GET /attendance/summary: Retrieved successfully")
        assert str(trainee_id) in summary
    else:
        print(f"   ❌ GET /attendance/summary FAILED: {resp.status_code} - {resp.text}")

    # 8. Test Profile
    print("\n8. Testing Profile...")
    # Get
    resp = client.get("/api/trainer/profile", headers=headers)
    if resp.status_code == 200:
        profile = resp.json()
        print(f"   ✅ GET /profile: {profile['name']}")
    else:
        print(f"   ❌ GET /profile FAILED: {resp.status_code} - {resp.text}")

    # Update
    update_profile_payload = {
        "specialization": "HIIT Expert",
        "bio": "Updated bio via test"
    }
    resp = client.put("/api/trainer/profile", json=update_profile_payload, headers=headers)
    if resp.status_code == 200:
        print(f"   ✅ PUT /profile: Updated successfully")
    else:
        print(f"   ❌ PUT /profile FAILED: {resp.status_code} - {resp.text}")

    print("\n✨ All tests completed!")

if __name__ == "__main__":
    run_tests()
