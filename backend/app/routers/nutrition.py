from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from app.database import get_db
from app.models import NutritionLog, DietPlan, User
from app.auth_util import require_role

router = APIRouter()


class NutritionLogCreate(BaseModel):
    item: str
    calories: float
    macros_json: Optional[dict] = None
    image_url: Optional[str] = None


class DietPlanCreate(BaseModel):
    plan_json: dict
    end_date: Optional[str] = None


@router.get("/")
async def nutrition_status():
    """Check nutrition service status"""
    return {
        "status": "running",
        "features": [
            "nutrition_logging",
            "diet_plans",
            "food_tracking",
            "daily_summary",
            "weekly_summary",
            "delete_log",
            "ai_food_recognition_stub"
        ]
    }


# ─────────────────────────────────────────────────────────
# BASIC LOGGING
# ─────────────────────────────────────────────────────────

@router.post("/log")
async def log_nutrition(
    log_data: NutritionLogCreate,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
):
    """Log a nutrition entry (manual or AI-detected)"""
    try:
        nutrition_log = NutritionLog(
            trainee_id=current_user.id,
            item=log_data.item,
            calories=log_data.calories,
            macros_json=log_data.macros_json,
            image_url=log_data.image_url
        )
        db.add(nutrition_log)
        db.commit()
        db.refresh(nutrition_log)

        return {
            "id": nutrition_log.id,
            "message": "Nutrition logged successfully",
            "log": {
                "item": nutrition_log.item,
                "calories": nutrition_log.calories,
                "date": nutrition_log.date.isoformat() if nutrition_log.date else None
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error logging nutrition: {str(e)}")


# ─────────────────────────────────────────────────────────
# AI FOOD PHOTO (STUB IMPLEMENTATION)
# ─────────────────────────────────────────────────────────

@router.post("/upload-photo")
async def upload_food_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
):
    """
    Upload food photo for AI recognition.

    Currently returns a mock/dummy prediction so the frontend flow works.
    You can later plug in:
      - OpenAI Vision
      - Google Vision
      - Clarifai Food Model
    """
    # NOTE: We are NOT actually reading or storing the file here.
    # In production you would save to storage and send to an AI model.
    filename = file.filename

    # Mock prediction
    mock_item = "Grilled Chicken with Rice"
    mock_calories = 520
    mock_macros = {
        "protein": 40,
        "carbs": 55,
        "fats": 15,
    }

    return {
        "status": "mock",
        "message": "Food recognition demo result. Replace with real AI model later.",
        "filename": filename,
        "item": mock_item,
        "calories": mock_calories,
        "macros": mock_macros,
    }


# ─────────────────────────────────────────────────────────
# DIET PLAN
# ─────────────────────────────────────────────────────────

@router.post("/generate-plan")
async def generate_diet_plan(
    plan_data: Optional[DietPlanCreate] = None,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
):
    """Generate AI-powered diet plan (currently placeholder + storage)"""
    try:
        if not plan_data:
            # Return placeholder plan
            return {
                "message": "Diet plan generation not yet implemented",
                "suggestion": "Integrate OpenAI API for personalized meal planning",
                "status": "not_implemented"
            }

        # Save diet plan
        diet_plan = DietPlan(
            trainee_id=current_user.id,
            plan_json=plan_data.plan_json
        )
        db.add(diet_plan)
        db.commit()
        db.refresh(diet_plan)

        return {
            "id": diet_plan.id,
            "message": "Diet plan created successfully",
            "plan": plan_data.plan_json
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating diet plan: {str(e)}")


# ─────────────────────────────────────────────────────────
# NUTRITION LOGS + DAILY TOTALS
# ─────────────────────────────────────────────────────────

@router.get("/logs")
async def get_nutrition_logs(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
    limit: int = 30,
    date: Optional[str] = None,
):
    """Get nutrition logs for current user (optionally filter by date)"""
    query = db.query(NutritionLog).filter(NutritionLog.trainee_id == current_user.id)

    if date:
        # Filter by specific date
        try:
            filter_date = datetime.fromisoformat(date).date()
            query = query.filter(NutritionLog.date == filter_date)
        except ValueError:
            pass  # Invalid date format, ignore filter

    logs = query.order_by(NutritionLog.created_at.desc()).limit(limit).all()

    # Calculate daily totals
    total_calories = sum(log.calories or 0 for log in logs)
    total_protein = sum((log.macros_json or {}).get('protein', 0) for log in logs)
    total_carbs = sum((log.macros_json or {}).get('carbs', 0) for log in logs)
    total_fats = sum((log.macros_json or {}).get('fats', 0) for log in logs)

    return {
        "logs": [
            {
                "id": log.id,
                "item": log.item,
                "calories": log.calories,
                "macros_json": log.macros_json,
                "date": log.date.isoformat() if log.date else None,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        "daily_totals": {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fats": total_fats
        }
    }


# ─────────────────────────────────────────────────────────
# ✅ DAILY NUTRITION SUMMARY API
# ─────────────────────────────────────────────────────────

@router.get("/summary")
async def get_daily_summary(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
    date: Optional[str] = None,
):
    """
    Get daily nutrition summary for a given date (default: today).
    Returns totals + simple static goals + remaining.
    """
    if date:
        try:
            target_date = datetime.fromisoformat(date).date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format YYYY-MM-DD")
    else:
        target_date = datetime.utcnow().date()

    logs = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date == target_date
    ).all()

    total_calories = sum(log.calories or 0 for log in logs)
    total_protein = sum((log.macros_json or {}).get('protein', 0) for log in logs)
    total_carbs = sum((log.macros_json or {}).get('carbs', 0) for log in logs)
    total_fats = sum((log.macros_json or {}).get('fats', 0) for log in logs)

    # Static example goals – you can later store these per-user
    goals = {
        "calories": 2000,
        "protein": 120,
        "carbs": 220,
        "fats": 60,
    }

    remaining = {
        "calories": max(goals["calories"] - total_calories, 0),
        "protein": max(goals["protein"] - total_protein, 0),
        "carbs": max(goals["carbs"] - total_carbs, 0),
        "fats": max(goals["fats"] - total_fats, 0),
    }

    return {
        "date": target_date.isoformat(),
        "totals": {
            "calories": total_calories,
            "protein": total_protein,
            "carbs": total_carbs,
            "fats": total_fats
        },
        "goals": goals,
        "remaining": remaining,
        "logs_count": len(logs),
    }


# ─────────────────────────────────────────────────────────
# ✅ WEEKLY NUTRITION SUMMARY API (FOR CHARTS)
# ─────────────────────────────────────────────────────────

@router.get("/weekly-summary")
async def get_weekly_summary(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
    days: int = 7,
):
    """
    Get last N days of nutrition summary for charting.
    Returns an array of {date, calories, protein, carbs, fats}
    """
    if days < 1:
        days = 1
    if days > 30:
        days = 30  # safety cap

    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days - 1)

    logs = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date >= start_date
    ).order_by(NutritionLog.date.asc()).all()

    # Aggregate per date
    daily_map: Dict[str, Dict[str, float]] = {}
    for log in logs:
        d_str = (log.date or today).isoformat()
        if d_str not in daily_map:
            daily_map[d_str] = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
        daily_map[d_str]["calories"] += log.calories or 0
        daily_map[d_str]["protein"] += (log.macros_json or {}).get("protein", 0)
        daily_map[d_str]["carbs"] += (log.macros_json or {}).get("carbs", 0)
        daily_map[d_str]["fats"] += (log.macros_json or {}).get("fats", 0)

    # Ensure we return all days even if 0
    days_list: List[Dict[str, Any]] = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        agg = daily_map.get(d_str, {"calories": 0, "protein": 0, "carbs": 0, "fats": 0})
        days_list.append({
            "date": d_str,
            **agg
        })

    return {
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "days": days_list
    }


# ─────────────────────────────────────────────────────────
# ✅ DELETE FOOD LOG FEATURE
# ─────────────────────────────────────────────────────────

@router.delete("/log/{log_id}")
async def delete_nutrition_log(
    log_id: int,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
):
    """Delete a nutrition log entry owned by the current user"""
    log = db.query(NutritionLog).filter(
        NutritionLog.id == log_id,
        NutritionLog.trainee_id == current_user.id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")

    try:
        db.delete(log)
        db.commit()
        return {"message": "Nutrition log deleted successfully", "id": log_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting nutrition log: {str(e)}")


# ─────────────────────────────────────────────────────────
# ALIASES / COMPAT ENDPOINTS
# ─────────────────────────────────────────────────────────

@router.get("/plans")
async def get_diet_plans(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    """Get diet plans for current user"""
    plans = db.query(DietPlan).filter(
        DietPlan.trainee_id == current_user.id
    ).order_by(DietPlan.created_at.desc()).all()

    return {
        "plans": [
            {
                "id": plan.id,
                "plan_json": plan.plan_json,
                "start_date": plan.start_date.isoformat() if plan.start_date else None,
                "end_date": plan.end_date.isoformat() if plan.end_date else None
            }
            for plan in plans
        ]
    }


@router.post("/track")
async def track_food(
    log_data: NutritionLogCreate,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    """Track food (alias for log_nutrition)"""
    return await log_nutrition(log_data, current_user, db)


@router.get("/meal-plans")
async def get_meal_plans(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    """Get meal plans (alias for get_diet_plans)"""
    return await get_diet_plans(current_user, db)


@router.get("/history")
async def get_history(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    """Get nutrition history (alias for get_nutrition_logs)"""
    return await get_nutrition_logs(current_user, db)
