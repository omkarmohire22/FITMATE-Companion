"""
Nutrition Tracker Router - Food logging and meal analysis
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models import User, NutritionLog
from app.auth_util import require_role
from app.services.nutrition_ai import (
    analyze_meal_from_image,
    get_nutrition_for_food,
    find_best_match,
    NUTRITION_DATABASE
)

router = APIRouter()


# ====================== SCHEMAS ======================

class FoodLogRequest(BaseModel):
    food_name: str
    portion_grams: float = 100
    meal_type: Optional[str] = "snack"
    meal_time: Optional[str] = None
    notes: Optional[str] = None


# ====================== IMAGE UPLOAD & ANALYSIS ======================

@router.post("/analyze-meal")
async def analyze_meal_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Upload meal photo and get nutrition analysis."""
    try:
        image_data = await file.read()
        
        if not image_data:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Call nutrition AI service
        result = analyze_meal_from_image(image_data, file.filename or "meal.jpg")
        
        if result.get("status") == "success":
            nutrition = result.get("nutrition_summary", {})
            
            # Return analysis without saving yet (user confirms first)
            return {
                "status": "success",
                **result
            }
        else:
            error_msg = result.get("message", "Could not analyze meal")
            raise HTTPException(status_code=400, detail=error_msg)
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"Error in analyze_meal_image: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ====================== MANUAL FOOD LOGGING ======================

@router.post("/log-food")
async def log_food(
    request: FoodLogRequest,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Manually log a food item."""
    try:
        nutrition = get_nutrition_for_food(request.food_name, request.portion_grams)
        
        if not nutrition:
            raise HTTPException(
                status_code=404,
                detail=f"Food '{request.food_name}' not found in database"
            )
        
        # Store notes in macros_json for compatibility
        macros_data = {
            "protein": nutrition["protein"],
            "carbs": nutrition["carbs"],
            "fats": nutrition["fats"],
            "meal_type": request.meal_type,
            "portion_grams": request.portion_grams,
            "meal_time": request.meal_time,
            "notes": request.notes,
        }
        
        nutrition_log = NutritionLog(
            trainee_id=current_user.id,
            item=request.food_name,
            calories=int(nutrition["calories"]),
            macros_json=macros_data
        )
        
        db.add(nutrition_log)
        db.commit()
        db.refresh(nutrition_log)
        
        return {
            "success": True,
            "status": "success",
            "log_id": nutrition_log.id,
            "food": request.food_name,
            "portion_grams": request.portion_grams,
            "nutrition": nutrition,
            "logged_at": nutrition_log.date.isoformat() if nutrition_log.date else datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(f"Error in log_food: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to log food: {str(e)}")


# ====================== DAILY SUMMARY ======================

@router.get("/daily-summary")
async def get_daily_nutrition(
    target_date: Optional[str] = None,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get nutrition summary for a specific day (or today)."""
    if target_date:
        try:
            query_date = datetime.fromisoformat(target_date).date()
        except:
            raise HTTPException(status_code=400, detail="Invalid date format")
    else:
        query_date = datetime.utcnow().date()
    
    # Get all logs for this date
    logs = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date >= query_date,
        NutritionLog.date < query_date + timedelta(days=1)
    ).all()
    
    # Calculate totals
    total_calories = sum(log.calories or 0 for log in logs)
    total_protein = sum(log.macros_json.get("protein", 0) if log.macros_json else 0 for log in logs)
    total_carbs = sum(log.macros_json.get("carbs", 0) if log.macros_json else 0 for log in logs)
    total_fats = sum(log.macros_json.get("fats", 0) if log.macros_json else 0 for log in logs)
    
    # Get trainee profile for daily goal
    trainee_profile = current_user.trainee_profile
    daily_goal = {
        "calories": 2200,
        "protein": 120,
        "carbs": 275,
        "fats": 73
    }
    
    if trainee_profile and trainee_profile.weight:
        daily_goal["protein"] = int(trainee_profile.weight * 2)
        daily_goal["calories"] = int(trainee_profile.weight * 30)
    
    return {
        "date": query_date.isoformat(),
        "total_calories": total_calories,
        "total_protein": round(total_protein, 1),
        "total_carbs": round(total_carbs, 1),
        "total_fats": round(total_fats, 1),
        "meals_logged": len(logs),
        "logs": [
            {
                "id": log.id,
                "food": log.item,
                "item": log.item,  # Add both for compatibility
                "calories": log.calories,
                "macros": log.macros_json,
                "meal_type": log.macros_json.get("meal_type") if log.macros_json else None,
                "meal_time": log.macros_json.get("meal_time") if log.macros_json else None,
                "portion_grams": log.macros_json.get("portion_grams") if log.macros_json else None,
                "notes": log.notes,
                "logged_at": log.date.isoformat() if log.date else None
            }
            for log in logs
        ],
        "goals": daily_goal,
        "daily_goal": daily_goal,
        "water_intake": 0,  # Add water tracking
        "progress": {
            "calories_remaining": max(0, daily_goal["calories"] - total_calories),
            "protein_remaining": max(0, daily_goal["protein"] - total_protein),
            "carbs_remaining": max(0, daily_goal["carbs"] - total_carbs),
            "fats_remaining": max(0, daily_goal["fats"] - total_fats)
        }
    }


# ====================== NUTRITION HISTORY ======================

@router.get("/logs")
async def get_nutrition_logs(
    days: int = 7,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get nutrition logs for the last N days."""
    start_date = datetime.utcnow().date() - timedelta(days=days)
    
    logs = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date >= start_date
    ).order_by(NutritionLog.date.desc()).all()
    
    return {
        "logs_count": len(logs),
        "period_days": days,
        "logs": [
            {
                "id": log.id,
                "food": log.item,
                "calories": log.calories,
                "macros": log.macros_json,
                "date": log.date.isoformat() if log.date else None
            }
            for log in logs
        ]
    }


# ====================== DELETE LOG ======================

@router.delete("/logs/{log_id}")
async def delete_nutrition_log(
    log_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Delete a nutrition log entry."""
    log = db.query(NutritionLog).filter(
        NutritionLog.id == log_id,
        NutritionLog.trainee_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    db.delete(log)
    db.commit()
    
    return {"status": "success", "message": "Log deleted"}


# ====================== SEARCH FOOD DATABASE ======================

@router.get("/search-food/{food_name}")
async def search_food(
    food_name: str,
    current_user: User = Depends(require_role(["trainee"])),
):
    """Search for a food in the database."""
    match = find_best_match(food_name)
    
    if match:
        matched_name, nutrition = match
        return {
            "found": True,
            "food": matched_name,
            "nutrition_per_100g": {
                "calories": nutrition[0],
                "protein": nutrition[1],
                "carbs": nutrition[2],
                "fats": nutrition[3]
            }
        }
    
    # Return similar foods
    similar = [food for food in NUTRITION_DATABASE.keys() if food_name.lower() in food.lower()]
    
    return {
        "found": False,
        "searched_for": food_name,
        "similar_foods": similar[:5],
        "message": "Food not found. Try one of the similar foods or use the exact name."
    }
