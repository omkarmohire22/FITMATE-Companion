from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from typing import Optional, List, Dict, Any

from app.database import get_db
from app.models import ProgressMeasurement, User, Trainer, Trainee, Workout
from app.auth_util import require_role

router = APIRouter()


# ─────────────────────────────────────────────
# ✅ ADD MEASUREMENT (Used in addMeasurement())
# ─────────────────────────────────────────────
@router.post("/measurements")
async def add_measurement(
    data: dict,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    try:
        measurement = ProgressMeasurement(
            trainee_id=current_user.id,
            weight=data.get("weight"),
            body_fat=data.get("body_fat"),
            muscle_mass=data.get("muscle_mass"),
            chest=data.get("chest"),
            waist=data.get("waist"),
            hips=data.get("hips"),
            biceps=data.get("biceps"),
            notes=data.get("notes"),
            date=datetime.utcnow().date()
        )

        db.add(measurement)
        db.commit()
        db.refresh(measurement)

        return {"message": "Measurement added successfully", "id": measurement.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────
# ✅ GET ALL PROGRESS (Used in loadProgress())
# ─────────────────────────────────────────────
@router.get("/progress")
async def get_progress(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    measurements = (
        db.query(ProgressMeasurement)
        .filter(ProgressMeasurement.trainee_id == current_user.id)
        .order_by(ProgressMeasurement.date.asc())
        .all()
    )

    return {
        "measurements": [
            {
                "id": m.id,
                "date": m.date.isoformat(),
                "weight": m.weight,
                "body_fat": m.body_fat,
                "muscle_mass": m.muscle_mass,
                "chest": m.chest,
                "waist": m.waist,
                "hips": m.hips,
                "biceps": m.biceps,
                "notes": m.notes,
            }
            for m in measurements
        ]
    }


# ─────────────────────────────────────────────
# ✅ TREND ANALYTICS (For Charts & Reports)
# ─────────────────────────────────────────────
@router.get("/progress/analytics")
async def get_progress_analytics(
    days: int = 30,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    start_date = datetime.utcnow().date() - timedelta(days=days)

    measurements = (
        db.query(ProgressMeasurement)
        .filter(
            ProgressMeasurement.trainee_id == current_user.id,
            ProgressMeasurement.date >= start_date
        )
        .order_by(ProgressMeasurement.date.asc())
        .all()
    )

    return {
        "days": days,
        "count": len(measurements),
        "data": [
            {
                "date": m.date.isoformat(),
                "weight": m.weight,
                "body_fat": m.body_fat,
                "muscle_mass": m.muscle_mass
            }
            for m in measurements
        ]
    }


# ─────────────────────────────────────────────
# ✅ TRAINER VIEW TRAINEE PROGRESS
# ─────────────────────────────────────────────
@router.get("/trainer/{trainee_id}/progress")
async def trainer_view_progress(
    trainee_id: int,
    current_user: User = Depends(require_role(["trainer"])),
    db: Session = Depends(get_db)
):
    trainer = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()

    if not trainer or not trainee or trainee.trainer_id != trainer.id:
        raise HTTPException(status_code=403, detail="Access denied")

    measurements = (
        db.query(ProgressMeasurement)
        .filter(ProgressMeasurement.trainee_id == trainee.user_id)
        .order_by(ProgressMeasurement.date.asc())
        .all()
    )

    return {
        "trainee_id": trainee_id,
        "progress": [
            {
                "date": m.date.isoformat(),
                "weight": m.weight,
                "body_fat": m.body_fat,
                "muscle_mass": m.muscle_mass,
                "chest": m.chest,
                "waist": m.waist,
                "biceps": m.biceps
            }
            for m in measurements
        ]
    }


# ─────────────────────────────────────────────
# ✅ AUTO PROGRESS REPORT (TEXT REPORT)
# ─────────────────────────────────────────────
@router.get("/progress/report")
async def generate_progress_report(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    records = (
        db.query(ProgressMeasurement)
        .filter(ProgressMeasurement.trainee_id == current_user.id)
        .order_by(ProgressMeasurement.date.asc())
        .all()
    )

    if len(records) < 2:
        return {"message": "Not enough data for report"}

    start, end = records[0], records[-1]

    report = {
        "starting_weight": start.weight,
        "current_weight": end.weight,
        "weight_change": round(end.weight - start.weight, 2),
        "start_body_fat": start.body_fat,
        "current_body_fat": end.body_fat,
        "muscle_gain": (
            (end.muscle_mass - start.muscle_mass)
            if start.muscle_mass and end.muscle_mass
            else None
        ),
        "duration_days": (end.date - start.date).days,
        "remarks": "Good progress" if end.weight < start.weight else "Needs improvement"
    }

    return report


# ─────────────────────────────────────────────
# ✅ GET WORKOUT STATISTICS
# ─────────────────────────────────────────────
@router.get("/workouts/stats")
async def get_workout_stats(
    days: Optional[int] = 30,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get workout statistics for the last N days"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    workouts = (
        db.query(Workout)
        .filter(
            Workout.trainee_id == current_user.id,
            Workout.start_time >= start_date
        )
        .all()
    )
    
    if not workouts:
        return {
            "total_workouts": 0,
            "total_duration": 0,
            "total_calories": 0,
            "avg_duration": 0,
            "workout_types": {},
            "workouts_by_week": [],
            "recent_workouts": []
        }
    
    # Calculate stats
    total_duration = sum(w.duration_minutes or 0 for w in workouts)
    total_calories = sum(w.calories_burned or 0 for w in workouts)
    
    # Group by exercise type
    workout_types = {}
    for w in workouts:
        if w.exercise_type:
            workout_types[w.exercise_type] = workout_types.get(w.exercise_type, 0) + 1
    
    # Group by week
    workouts_by_week = {}
    for w in workouts:
        if w.start_time:
            week = w.start_time.strftime("%Y-W%W")
            workouts_by_week[week] = workouts_by_week.get(week, 0) + 1
    
    # Recent workouts
    recent_workouts = sorted(workouts, key=lambda x: x.start_time or datetime.min, reverse=True)[:10]
    
    return {
        "total_workouts": len(workouts),
        "total_duration": total_duration,
        "total_calories": round(total_calories, 2),
        "avg_duration": round(total_duration / len(workouts), 1) if workouts else 0,
        "workout_types": workout_types,
        "workouts_by_week": [{"week": k, "count": v} for k, v in sorted(workouts_by_week.items())],
        "recent_workouts": [
            {
                "id": w.id,
                "exercise_type": w.exercise_type,
                "start_time": w.start_time.isoformat() if w.start_time else None,
                "duration_minutes": w.duration_minutes,
                "calories_burned": w.calories_burned,
                "total_reps": w.total_reps
            }
            for w in recent_workouts
        ]
    }


# ─────────────────────────────────────────────
# ✅ GET WORKOUT HISTORY WITH DATE RANGE
# ─────────────────────────────────────────────
@router.get("/workouts/history")
async def get_workout_history(
    days: Optional[int] = 30,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get detailed workout history"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    workouts = (
        db.query(Workout)
        .filter(
            Workout.trainee_id == current_user.id,
            Workout.start_time >= start_date
        )
        .order_by(Workout.start_time.desc())
        .all()
    )
    
    return {
        "workouts": [
            {
                "id": w.id,
                "exercise_type": w.exercise_type,
                "start_time": w.start_time.isoformat() if w.start_time else None,
                "end_time": w.end_time.isoformat() if w.end_time else None,
                "duration_minutes": w.duration_minutes,
                "calories_burned": w.calories_burned,
                "total_reps": w.total_reps,
                "avg_accuracy": w.avg_accuracy,
                "summary": w.summary_json
            }
            for w in workouts
        ]
    }


# ─────────────────────────────────────────────
# ✅ GET PROGRESS WITH WORKOUT CORRELATION
# ─────────────────────────────────────────────
@router.get("/analytics/correlation")
async def get_progress_workout_correlation(
    days: Optional[int] = 30,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Analyze correlation between workouts and progress"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Get measurements
    measurements = (
        db.query(ProgressMeasurement)
        .filter(
            ProgressMeasurement.trainee_id == current_user.id,
            ProgressMeasurement.date >= start_date.date()
        )
        .order_by(ProgressMeasurement.date.asc())
        .all()
    )
    
    # Get workouts
    workouts = (
        db.query(Workout)
        .filter(
            Workout.trainee_id == current_user.id,
            Workout.start_time >= start_date
        )
        .all()
    )
    
    if len(measurements) < 2:
        return {
            "message": "Not enough measurement data",
            "workouts_count": len(workouts),
            "measurements_count": len(measurements)
        }
    
    # Calculate changes
    first_measurement = measurements[0]
    last_measurement = measurements[-1]
    
    weight_change = (last_measurement.weight - first_measurement.weight) if (first_measurement.weight and last_measurement.weight) else 0
    body_fat_change = (last_measurement.body_fat - first_measurement.body_fat) if (first_measurement.body_fat and last_measurement.body_fat) else 0
    muscle_change = (last_measurement.muscle_mass - first_measurement.muscle_mass) if (first_measurement.muscle_mass and last_measurement.muscle_mass) else 0
    
    # Workout intensity (workouts per week)
    total_weeks = days / 7
    workouts_per_week = len(workouts) / total_weeks if total_weeks > 0 else 0
    
    # Generate insight
    insight = ""
    if len(workouts) > 0:
        if weight_change < 0:
            insight = f"You've lost {abs(weight_change):.1f}kg with {len(workouts)} workouts! Keep it up!"
        elif weight_change > 0 and muscle_change > 0:
            insight = f"You've gained {muscle_change:.1f}kg of muscle mass with {len(workouts)} workouts!"
        elif len(workouts) > 10:
            insight = f"Great consistency with {len(workouts)} workouts completed!"
        else:
            insight = f"You've completed {len(workouts)} workouts. Try to increase frequency for better results!"
    
    return {
        "period_days": days,
        "total_workouts": len(workouts),
        "workouts_per_week": round(workouts_per_week, 1),
        "weight_change": round(weight_change, 2),
        "body_fat_change": round(body_fat_change, 2),
        "muscle_change": round(muscle_change, 2),
        "insight": insight,
        "timeline": [
            {
                "date": m.date.isoformat(),
                "weight": m.weight,
                "body_fat": m.body_fat,
                "muscle_mass": m.muscle_mass,
                "workouts_count": len([
                    w for w in workouts 
                    if w.start_time and w.start_time.date() == m.date
                ])
            }
            for m in measurements
        ]
    }
