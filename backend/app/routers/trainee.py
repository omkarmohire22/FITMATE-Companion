
# ======================= IMPORTS =======================
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from pydantic import BaseModel
import random
from app.schemas import PaymentCreate, WorkoutCreate, WorkoutUpdate, MeasurementCreate, WorkoutResponse, NutritionLogCreate, NutritionLogResponse, ProgressPhotoCreate, ProgressPhotoResponse, MessageCreate, MessageResponse
from app.database import get_db
from app.models import User, Workout, Measurement, NutritionLog, ProgressPhoto, Message, Trainee, MembershipPlan, Payment, Membership, Attendance, Notification, TrainerSchedule, Trainer
from app.auth_util import get_current_user, require_role

# ======================= ROUTER INIT =======================
router = APIRouter()

# ======================= GET WORKOUTS (HISTORY) =======================
@router.get("/workouts")
async def get_workouts(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
) -> Any:
    workouts = db.query(Workout).filter(Workout.trainee_id == current_user.id).order_by(Workout.start_time.desc()).all()
    # Serialize workouts for frontend
    result = []
    for w in workouts:
        result.append({
            "id": w.id,
            "created_at": w.start_time.isoformat() if w.start_time else None,
            "exercise_type": w.exercise_type,
            "total_reps": w.total_reps,
            "avg_accuracy": w.avg_accuracy,
            "calories_burned": w.calories_burned,
            "duration_minutes": w.duration_minutes,
        })
    return {"workouts": result}

@router.get("/profile", status_code=status.HTTP_200_OK)
async def get_trainee_profile(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    # Get the user and their trainee profile
    trainee = db.query(User).filter(User.id == current_user.id).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
    # Get extended trainee profile fields
    trainee_profile = trainee.trainee_profile
    profile_data = {
        "id": trainee.id,
        "name": trainee.name,
        "email": trainee.email,
        "phone": trainee.phone,
        "role": trainee.role.value,
        "is_active": trainee.is_active,
        "is_verified": trainee.is_verified,
        "created_at": trainee.created_at.isoformat() if trainee.created_at else None,
    }
    # Add extended fields if available
    if trainee_profile:
        profile_data.update({
            "goal": trainee_profile.goal,
            "weight": trainee_profile.weight,
            "height": trainee_profile.height,
            "target_weight": trainee_profile.target_weight,
            "fitness_level": trainee_profile.fitness_level,
            "trainer_id": str(trainee_profile.trainer_id) if trainee_profile.trainer_id else None,
            # New enhanced fields
            "fitness_goals": trainee_profile.fitness_goals,
            "date_of_birth": trainee_profile.date_of_birth.isoformat() if trainee_profile.date_of_birth else None,
            "gender": trainee_profile.gender,
            "address": trainee_profile.address,
            "emergency_contact_name": trainee_profile.emergency_contact_name,
            "emergency_contact_phone": trainee_profile.emergency_contact_phone,
            "health_conditions": trainee_profile.health_conditions,
        })
    return profile_data


# ======================= UPDATE PROFILE =======================

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    goal: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    target_weight: Optional[float] = None
    fitness_level: Optional[str] = None
    fitness_goals: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    health_conditions: Optional[str] = None


@router.put("/profile", status_code=status.HTTP_200_OK)
async def update_trainee_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Update trainee profile information"""
    # Update user fields
    if data.name:
        current_user.name = data.name
    if data.phone:
        current_user.phone = data.phone
    
    # Get or create trainee profile
    trainee_profile = current_user.trainee_profile
    if not trainee_profile:
        # Create new trainee profile if doesn't exist
        from app.models import Trainee
        trainee_profile = Trainee(user_id=current_user.id)
        db.add(trainee_profile)
    
    # Update trainee profile fields
    if data.goal is not None:
        trainee_profile.goal = data.goal
    if data.weight is not None:
        trainee_profile.weight = data.weight
    if data.height is not None:
        trainee_profile.height = data.height
    if data.target_weight is not None:
        trainee_profile.target_weight = data.target_weight
    if data.fitness_level is not None:
        trainee_profile.fitness_level = data.fitness_level
    if data.fitness_goals is not None:
        trainee_profile.fitness_goals = data.fitness_goals
    if data.date_of_birth is not None:
        from datetime import datetime as dt
        try:
            trainee_profile.date_of_birth = dt.fromisoformat(data.date_of_birth).date() if data.date_of_birth else None
        except:
            pass
    if data.gender is not None:
        trainee_profile.gender = data.gender
    if data.address is not None:
        trainee_profile.address = data.address
    if data.emergency_contact_name is not None:
        trainee_profile.emergency_contact_name = data.emergency_contact_name
    if data.emergency_contact_phone is not None:
        trainee_profile.emergency_contact_phone = data.emergency_contact_phone
    if data.health_conditions is not None:
        trainee_profile.health_conditions = data.health_conditions
    
    db.commit()
    
    return {"message": "Profile updated successfully"}


# ======================= EXTRA SCHEMA =======================

class ManualWorkoutCreate(BaseModel):
    exercise_type: str
    duration_minutes: int
    total_reps: Optional[int] = None
    calories_burned: Optional[float] = None
    notes: Optional[str] = None


# ======================= DASHBOARD =======================

@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    week_ago = datetime.utcnow() - timedelta(days=7)

    # Workouts

    this_week_workouts = db.query(Workout).filter(
        Workout.trainee_id == current_user.id,
        Workout.start_time >= week_ago
    ).count()

    total_workouts = db.query(Workout).filter(
        Workout.trainee_id == current_user.id
    ).count()

    # Calories (sum for today)
    today = datetime.utcnow().date()
    calories = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date == today
    ).with_entities(NutritionLog.calories).all()
    calories = sum([c[0] for c in calories if c[0] is not None]) if calories else 0

    # Calories burned (sum for today)
    workouts_today = db.query(Workout).filter(
        Workout.trainee_id == current_user.id,
        Workout.start_time >= datetime.combine(today, datetime.min.time()),
        Workout.start_time <= datetime.combine(today, datetime.max.time())
    ).all()
    calories_burned = sum([w.calories_burned or 0 for w in workouts_today])

    # Water intake (not tracked, set to 0 or dummy value)
    water_intake = 0

    # Water goal (default 8 glasses)
    water_goal = 8

    # Streak (days with at least 1 workout)
    streak = 0
    for i in range(0, 100):
        day = today - timedelta(days=i)
        count = db.query(Workout).filter(
            Workout.trainee_id == current_user.id,
            Workout.start_time >= datetime.combine(day, datetime.min.time()),
            Workout.start_time <= datetime.combine(day, datetime.max.time())
        ).count()
        if count > 0:
            streak += 1
        else:
            break

    # Achievements (dummy for now)
    achievements = 5

    # Average form score (last 10 workouts)
    last10 = db.query(Workout).filter(
        Workout.trainee_id == current_user.id
    ).order_by(Workout.start_time.desc()).limit(10).all()
    avg_form_score = round(sum([w.avg_accuracy or 0 for w in last10]) / len(last10), 1) if last10 else 0

    # Best streak (max consecutive days with workout)
    all_workouts = db.query(Workout).filter(
        Workout.trainee_id == current_user.id
    ).order_by(Workout.start_time.asc()).all()
    best_streak = 0
    current_streak = 0
    last_date = None
    for w in all_workouts:
        d = w.start_time.date()
        if last_date is None or (d - last_date).days == 1:
            current_streak += 1
        elif (d - last_date).days > 1:
            current_streak = 1
        last_date = d
        if current_streak > best_streak:
            best_streak = current_streak

    # Calories budget (dummy, could be personalized)
    calories_budget = 2200

    latest_measurement = db.query(Measurement).filter(
        Measurement.trainee_id == current_user.id
    ).order_by(Measurement.date.desc()).first()

    return {
        "weeklyWorkouts": this_week_workouts,
        "totalWorkouts": total_workouts,
        "calories": calories,
        "caloriesBudget": calories_budget,
        "caloriesBurned": calories_burned,
        "waterIntake": water_intake,
        "waterGoal": water_goal,
        "streak": streak,
        "achievements": achievements,
        "avgFormScore": avg_form_score,
        "bestStreak": best_streak,
        "currentWeight": latest_measurement.weight if latest_measurement else None
    }


# ======================= WORKOUTS =======================

@router.post("/workouts", response_model=WorkoutResponse)
async def start_workout(
    workout_data: WorkoutCreate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    workout = Workout(
        trainee_id=current_user.id,
        exercise_type=workout_data.exercise_type,
        start_time=datetime.utcnow()
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout


@router.patch("/workouts/{workout_id}", response_model=WorkoutResponse)
async def end_workout(
    workout_id: int,
    workout_update: WorkoutUpdate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.trainee_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    for field, value in workout_update.dict(exclude_unset=True).items():
        setattr(workout, field, value)

    if not workout.end_time:
        workout.end_time = datetime.utcnow()

    db.commit()
    db.refresh(workout)
    return workout


@router.put("/workouts/{workout_id}/update")
async def update_workout(
    workout_id: int,
    workout_update: WorkoutUpdate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.trainee_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    for field, value in workout_update.dict(exclude_unset=True).items():
        setattr(workout, field, value)

    db.commit()
    db.refresh(workout)

    return {"message": "Workout updated successfully"}


@router.delete("/workouts/{workout_id}")
async def delete_workout(
    workout_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    workout = db.query(Workout).filter(
        Workout.id == workout_id,
        Workout.trainee_id == current_user.id
    ).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    db.delete(workout)
    db.commit()
    return {"message": "Workout deleted successfully"}


# ======================= MANUAL WORKOUT =======================

@router.post("/workouts/manual")
async def log_manual_workout(
    workout_data: ManualWorkoutCreate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    start_time = datetime.utcnow() - timedelta(minutes=workout_data.duration_minutes)
    end_time = datetime.utcnow()

    workout = Workout(
        trainee_id=current_user.id,
        exercise_type=workout_data.exercise_type,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=workout_data.duration_minutes,
        total_reps=workout_data.total_reps,
        calories_burned=workout_data.calories_burned,
        summary_json={"notes": workout_data.notes, "manual_entry": True}
        if workout_data.notes else {"manual_entry": True}
    )

    db.add(workout)
    db.commit()
    db.refresh(workout)

    return {
        "id": workout.id,
        "message": "Manual workout logged successfully"
    }


# ======================= MEASUREMENTS =======================

@router.post("/measurements")
async def add_measurement(
    measurement: MeasurementCreate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    from app.models import ProgressMeasurement
    
    new_measurement = ProgressMeasurement(
        trainee_id=current_user.id,
        date=date.today(),
        weight=measurement.weight,
        body_fat=measurement.body_fat,
        muscle_mass=measurement.muscle_mass,
        chest=measurement.chest,
        waist=measurement.waist,
        hips=measurement.hips,
        biceps=measurement.biceps,
        notes=measurement.notes
    )

    db.add(new_measurement)
    db.commit()
    db.refresh(new_measurement)

    return {
        "message": "Measurement saved successfully",
        "id": new_measurement.id,
        "date": new_measurement.date.isoformat(),
        "weight": new_measurement.weight
    }


@router.delete("/measurements/{measurement_id}")
async def delete_measurement(
    measurement_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    measurement = db.query(Measurement).filter(
        Measurement.id == measurement_id,
        Measurement.trainee_id == current_user.id
    ).first()

    if not measurement:
        raise HTTPException(status_code=404, detail="Measurement not found")

    db.delete(measurement)
    db.commit()
    return {"message": "Measurement deleted successfully"}


# ======================= NUTRITION =======================

@router.post("/nutrition/logs", response_model=NutritionLogResponse)
async def log_nutrition(
    nutrition_data: NutritionLogCreate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    nutrition_log = NutritionLog(
        trainee_id=current_user.id,
        item=nutrition_data.item,
        calories=nutrition_data.calories,
        macros_json=nutrition_data.macros_json or {},
        image_url=nutrition_data.image_url
    )
    db.add(nutrition_log)
    db.commit()
    db.refresh(nutrition_log)
    return nutrition_log


@router.get("/nutrition/daily-summary")
async def daily_nutrition_summary(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    today = date.today()

    logs = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date >= today
    ).all()

    summary = {
        "calories": sum(log.calories for log in logs),
        "protein": sum((log.macros_json or {}).get("protein", 0) for log in logs),
        "carbs": sum((log.macros_json or {}).get("carbs", 0) for log in logs),
        "fats": sum((log.macros_json or {}).get("fats", 0) for log in logs),
    }

    return {
        "date": today.isoformat(),
        "summary": summary,
        "logs_count": len(logs)
    }


# ======================= MESSAGES =======================

@router.post("/messages/send", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    receiver = db.query(User).filter(User.id == message_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        message=message_data.message
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    # If receiver is admin, create notification
    if receiver.role == "ADMIN":
        notif = Notification(
            user_id=receiver.id,
            title="New message from Trainee",
            message=message_data.message,
            notification_type="message"
        )
        db.add(notif)
        db.commit()

    return message


@router.get("/messages/unread-count")
async def unread_message_count(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()

    return {"unread_messages": count}


@router.get("/messages")
async def get_messages(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
    page: int = 1,
    page_size: int = 20,
):
    offset = (page - 1) * page_size

    messages = db.query(Message).filter(
        (Message.sender_id == current_user.id) |
        (Message.receiver_id == current_user.id)
    ).order_by(Message.created_at.desc()).offset(offset).limit(page_size).all()

    total = db.query(Message).filter(
        (Message.sender_id == current_user.id) |
        (Message.receiver_id == current_user.id)
    ).count()

    return {
        "total_messages": total,
        "page": page,
        "page_size": page_size,
        "messages": messages
    }


@router.patch("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.receiver_id == current_user.id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.is_read = True
    db.commit()
    return {"message": "Message marked as read"}

@router.post("/payments/create")
async def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == data.user_id).first()
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == data.plan_id).first()

    if not user or not plan:
        raise HTTPException(404, "User or Plan not found")

    # Receipt number
    receipt_number = f"FM-{datetime.utcnow().strftime('%Y%m%d')}-{random.randint(10000,99999)}"

    payment = Payment(
        user_id=user.id,
        plan_id=plan.id,
        amount=data.amount,
        payment_mode=data.payment_mode.lower(),
        receipt_number=receipt_number,
    )

    db.add(payment)

    # Membership Activation
    start_date = date.today()
    end_date = start_date + timedelta(days=plan.duration_days)

    membership = Membership(
        user_id=user.id,
        plan_id=plan.id,
        start_date=start_date,
        end_date=end_date,
        is_active=True,
    )

    db.add(membership)
    db.commit()
    db.refresh(payment)

    # Generate receipt PDF
    from app.utils.pdf_generator import generate_receipt_pdf
    pdf_path = generate_receipt_pdf(payment)
    payment.receipt_pdf_url = pdf_path

    db.commit()

    return {
        "message": "Payment completed",
        "receipt_url": payment.receipt_pdf_url,
        "membership_end": end_date,
    }


# ======================= ATTENDANCE =======================

from app.models import Attendance

@router.post("/attendance/check-in")
async def check_in_attendance(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Check in to the gym"""
    try:
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # Auto-close any old unclosed attendance records (from previous days)
        old_unclosed = db.query(Attendance).filter(
            Attendance.trainee_id == current_user.id,
            Attendance.check_out_time == None,
            Attendance.check_in_time < today_start
        ).all()
        
        for record in old_unclosed:
            # Set check_out to end of that day and estimate duration
            if record.check_in_time:
                record.check_out_time = datetime.combine(record.check_in_time.date(), datetime.max.time().replace(microsecond=0))
                # Estimate 1 hour duration for unclosed sessions
                record.duration_minutes = 60
        
        if old_unclosed:
            db.commit()
        
        # Check if already checked in TODAY (only today's records)
        existing_today = db.query(Attendance).filter(
            Attendance.trainee_id == current_user.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time <= today_end,
            Attendance.check_out_time == None
        ).first()
        
        if existing_today:
            return {
                "status": "already_checked_in",
                "attendance_id": existing_today.id,
                "check_in_time": existing_today.check_in_time.isoformat() if existing_today.check_in_time else None
            }
        
        # Create new attendance record for today
        checkin_time = datetime.utcnow()
        attendance = Attendance(
            trainee_id=current_user.id,
            check_in_time=checkin_time,
            check_in_method="app"
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
        return {
            "status": "checked_in",
            "attendance_id": attendance.id,
            "check_in_time": attendance.check_in_time.isoformat() if attendance.check_in_time else None
        }
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Check-in error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error during check-in: {str(e)}")


@router.post("/attendance/check-out")
async def check_out_attendance(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Check out from the gym"""
    try:
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # Find today's open attendance record
        attendance = db.query(Attendance).filter(
            Attendance.trainee_id == current_user.id,
            Attendance.check_in_time >= today_start,
            Attendance.check_in_time <= today_end,
            Attendance.check_out_time == None
        ).first()
        
        if not attendance:
            raise HTTPException(status_code=400, detail="No active check-in found for today")
        
        # Set checkout time and calculate duration
        checkout_time = datetime.utcnow()
        attendance.check_out_time = checkout_time
        
        # Calculate duration in minutes
        if attendance.check_in_time:
            # Handle timezone-aware datetime
            check_in = attendance.check_in_time.replace(tzinfo=None) if attendance.check_in_time.tzinfo else attendance.check_in_time
            duration_delta = checkout_time - check_in
            attendance.duration_minutes = int(duration_delta.total_seconds() / 60)
        
        db.commit()
        db.refresh(attendance)
        
        return {
            "status": "checked_out",
            "attendance_id": attendance.id,
            "check_in_time": attendance.check_in_time.isoformat() if attendance.check_in_time else None,
            "check_out_time": attendance.check_out_time.isoformat() if attendance.check_out_time else None,
            "duration_minutes": attendance.duration_minutes or 0
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Check-out error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error during check-out: {str(e)}")


@router.get("/attendance/today")
async def get_today_attendance(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Get today's attendance status"""
    today = datetime.utcnow().date()
    
    attendance = db.query(Attendance).filter(
        Attendance.trainee_id == current_user.id,
        Attendance.check_in_time >= datetime.combine(today, datetime.min.time()),
        Attendance.check_in_time <= datetime.combine(today, datetime.max.time())
    ).first()
    
    if not attendance:
        return {"status": "not_checked_in", "attendance": None}
    
    return {
        "status": "checked_out" if attendance.check_out_time else "checked_in",
        "attendance": {
            "id": attendance.id,
            "check_in_time": attendance.check_in_time.isoformat() if attendance.check_in_time else None,
            "check_out_time": attendance.check_out_time.isoformat() if attendance.check_out_time else None,
            "duration_minutes": attendance.duration_minutes
        }
    }


@router.get("/attendance/history")
async def get_attendance_history(
    days: int = 30,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Get attendance history for the past N days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    records = db.query(Attendance).filter(
        Attendance.trainee_id == current_user.id,
        Attendance.check_in_time >= start_date
    ).order_by(Attendance.check_in_time.desc()).all()
    
    # Calculate stats
    total_visits = len(records)
    total_minutes = sum([r.duration_minutes or 0 for r in records])
    avg_duration = round(total_minutes / total_visits, 1) if total_visits > 0 else 0
    
    # Calculate streak
    dates_attended = set()
    for r in records:
        if r.check_in_time:
            dates_attended.add(r.check_in_time.date())
    
    streak = 0
    check_date = datetime.utcnow().date()
    while check_date in dates_attended:
        streak += 1
        check_date -= timedelta(days=1)
    
    # This month stats - handle timezone-aware/naive datetime comparison
    from datetime import timezone
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Make comparison work with both timezone-aware and naive datetimes
    this_month_records = []
    for r in records:
        check_time = r.check_in_time.replace(tzinfo=None) if r.check_in_time.tzinfo else r.check_in_time
        if check_time >= month_start:
            this_month_records.append(r)
    
    this_month_visits = len(this_month_records)
    
    return {
        "stats": {
            "total_visits": total_visits,
            "total_minutes": total_minutes,
            "avg_duration": avg_duration,
            "current_streak": streak,
            "this_month_visits": this_month_visits
        },
        "records": [
            {
                "id": r.id,
                "date": r.check_in_time.date().isoformat() if r.check_in_time else None,
                "check_in_time": r.check_in_time.isoformat() if r.check_in_time else None,
                "check_out_time": r.check_out_time.isoformat() if r.check_out_time else None,
                "duration_minutes": r.duration_minutes,
                "check_in_method": r.check_in_method
            }
            for r in records[:50]  # Limit to 50 records
        ]
    }


# ======================= TRAINEE NOTIFICATIONS =======================

@router.get("/notifications")
async def get_trainee_notifications(
    unread_only: bool = False,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Get notifications for the current trainee"""
    try:
        query = db.query(Notification).filter(Notification.user_id == current_user.id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
        
        unread_count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()
        
        return {
            "success": True,
            "unread_count": unread_count,
            "notifications": [
                {
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "notification_type": n.notification_type,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                    "read_at": n.read_at.isoformat() if n.read_at else None
                }
                for n in notifications
            ]
        }
    except Exception as e:
        print(f"Error fetching trainee notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.post("/notifications/{notification_id}/read")
async def mark_trainee_notification_read(
    notification_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Mark a notification as read for the current trainee"""
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
        
        return {"success": True, "message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notification as read")


@router.put("/notifications/mark-all-read")
async def mark_all_trainee_notifications_read(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for the current trainee"""
    try:
        unread_notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).all()
        
        for notification in unread_notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Marked {len(unread_notifications)} notifications as read",
            "count": len(unread_notifications)
        }
    except Exception as e:
        db.rollback()
        print(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notifications as read")


@router.delete("/notifications/{notification_id}")
async def delete_trainee_notification(
    notification_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Delete a notification for the current trainee"""
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        db.delete(notification)
        db.commit()
        
        return {"success": True, "message": "Notification deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")


# ======================= TRAINEE SCHEDULE (Training Sessions with Trainer) =======================

@router.get("/my-schedule")
async def get_my_training_schedule(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db),
):
    """Get trainee's scheduled training sessions with their trainer"""
    try:
        # Get trainee profile
        trainee_profile = db.query(Trainee).filter(Trainee.user_id == current_user.id).first()
        if not trainee_profile:
            return {"schedule": [], "trainer": None}
        
        # Get all schedule slots where this trainee is assigned
        schedules = db.query(TrainerSchedule).filter(
            TrainerSchedule.trainee_id == trainee_profile.id
        ).order_by(TrainerSchedule.day_of_week, TrainerSchedule.start_time).all()
        
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Get trainer info
        trainer_info = None
        if trainee_profile.trainer_id:
            trainer = db.query(Trainer).filter(Trainer.id == trainee_profile.trainer_id).first()
            if trainer:
                trainer_info = {
                    "id": str(trainer.id),
                    "name": trainer.user.name,
                    "email": trainer.user.email,
                    "phone": trainer.user.phone,
                    "specialization": trainer.specialization
                }
        
        result = []
        for s in schedules:
            # Get trainer for this schedule
            schedule_trainer = db.query(Trainer).filter(Trainer.id == s.trainer_id).first()
            
            result.append({
                "id": s.id,
                "day_of_week": s.day_of_week,
                "day_name": days[s.day_of_week] if s.day_of_week < 7 else "Unknown",
                "start_time": s.start_time.strftime("%H:%M") if s.start_time else None,
                "end_time": s.end_time.strftime("%H:%M") if s.end_time else None,
                "session_type": getattr(s, 'session_type', 'personal_training'),
                "notes": getattr(s, 'notes', None),
                "trainer": {
                    "name": schedule_trainer.user.name if schedule_trainer else "Unknown",
                    "specialization": schedule_trainer.specialization if schedule_trainer else None
                } if schedule_trainer else None
            })
        
        # Calculate today's sessions
        today = datetime.now().weekday()  # 0=Monday, 6=Sunday
        today_sessions = [s for s in result if s["day_of_week"] == today]
        
        # Calculate upcoming session (next one based on current day/time)
        upcoming = None
        current_time = datetime.now().strftime("%H:%M")
        for s in result:
            if s["day_of_week"] > today or (s["day_of_week"] == today and s["start_time"] > current_time):
                upcoming = s
                break
        
        return {
            "schedule": result,
            "trainer": trainer_info,
            "today_sessions": today_sessions,
            "upcoming_session": upcoming,
            "total_weekly_sessions": len(result)
        }
    except Exception as e:
        print(f"Error fetching trainee schedule: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch schedule")

