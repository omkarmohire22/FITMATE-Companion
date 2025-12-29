from backend.app.database import SessionLocal
from backend.app.models import User, Workout, NutritionLog, Measurement, Membership, MembershipPlan, UserRole
from datetime import datetime, timedelta, date

# CONFIGURE TRAINEE EMAIL HERE
TRAINEE_EMAIL = "trainee@fitmate.com"

# Sample data
sample_workout = {
    "exercise_type": "push-ups",
    "start_time": datetime.utcnow() - timedelta(days=1),
    "total_reps": 20,
    "avg_accuracy": 85.0,
    "calories_burned": 100,
    "duration_minutes": 10,
}
sample_nutrition = {
    "item": "Oatmeal & Eggs",
    "calories": 450,
    "date": date.today(),
}
sample_measurement = {
    "weight": 70.0,
    "body_fat": 18.0,
    "date": date.today(),
}
sample_membership_plan = {
    "name": "Premium",
    "membership_type": "premium",
    "price": 999.0,
    "duration_months": 1,
    "is_active": True,
}

sample_membership = {
    "start_date": date.today(),
    "end_date": date.today() + timedelta(days=30),
    "status": "active",
    "price": 999.0,
    "auto_renew": True,
}

def add_data():
    db = SessionLocal()
    user = db.query(User).filter(User.email == TRAINEE_EMAIL, User.role == UserRole.TRAINEE).first()
    if not user:
        print("Trainee user not found.")
        db.close()
        return

    # Add workout
    workout = Workout(trainee_id=user.id, **sample_workout)
    db.add(workout)

    # Add nutrition log
    nutrition = NutritionLog(trainee_id=user.id, **sample_nutrition)
    db.add(nutrition)

    # Add measurement
    measurement = Measurement(trainee_id=user.id, **sample_measurement)
    db.add(measurement)

    # Add membership plan if not exists
    plan = db.query(MembershipPlan).filter_by(membership_type=sample_membership_plan["membership_type"]).first()
    if not plan:
        plan = MembershipPlan(**sample_membership_plan)
        db.add(plan)
        db.commit()
        db.refresh(plan)
    # Add membership
    membership = Membership(trainee_id=user.id, membership_type=plan.membership_type, **sample_membership)
    db.add(membership)

    db.commit()
    print("Sample data added for trainee.")
    db.close()

if __name__ == "__main__":
    add_data()
