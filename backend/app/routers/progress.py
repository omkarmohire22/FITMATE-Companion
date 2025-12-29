from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.models import ProgressMeasurement, User, Trainer, Trainee
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
