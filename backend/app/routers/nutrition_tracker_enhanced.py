"""
Enhanced Nutrition Tracker Router v2.0
======================================
Features:
- AI meal analysis with confidence levels
- Personalized daily nutrition goals
- Smart recommendations
- Weekly meal prep plans
- Macro tracking and insights
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models import User, NutritionLog
from app.auth_util import require_role
from app.services.nutrition_enhanced import (
    analyze_meal_from_image,
    calculate_nutrition_for_portion,
    get_nutrition_per_100g,
    calculate_daily_nutrition_goals,
    get_nutrition_recommendations,
    suggest_meals_for_macros,
    get_meal_prep_plan,
)

router = APIRouter()


# ====================== REQUEST SCHEMAS ======================

class FoodLogRequest(BaseModel):
    """Manual food logging request"""
    food_name: str
    portion_grams: float = 100
    meal_type: Optional[str] = "snack"  # breakfast, lunch, dinner, snack
    meal_time: Optional[str] = None  # HH:MM format
    notes: Optional[str] = None


class NutritionGoalsUpdate(BaseModel):
    """Update personalized nutrition goals"""
    age: Optional[int] = None
    weight: float
    height: float
    gender: str  # M or F
    activity_level: str  # low, moderate, high
    fitness_goal: str  # lose, maintain, gain


class MealAnalysisRequest(BaseModel):
    """Meal analysis from image with confirmation"""
    confirmed: bool
    adjustments: Optional[dict] = None  # {food_name: portion_grams}


# ====================== IMAGE UPLOAD & AI ANALYSIS ======================

@router.post("/analyze-meal")
async def analyze_meal_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """
    Upload meal photo for AI analysis
    
    Returns:
    - Detected foods with confidence levels
    - Estimated nutrition breakdown
    - Confidence level of overall analysis
    """
    try:
        image_data = await file.read()
        
        if not image_data:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # AI Analysis
        result = analyze_meal_from_image(image_data, file.filename or "meal.jpg")
        
        if result.get("status") == "success":
            return {
                "status": "success",
                "detected_foods": result.get("detected_foods", []),
                "nutrition_summary": result.get("nutrition_summary", {}),
                "confidence_level": result.get("confidence_level", 0),
                "message": result.get("message", "Analysis complete. Please confirm to save."),
                "requires_confirmation": True
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("message", "Failed to analyze image"))
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error analyzing meal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ====================== MANUAL FOOD LOGGING ======================

@router.post("/log-food")
async def log_food(
    request: FoodLogRequest,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """
    Manually log a food item with calculated nutrition
    
    Returns:
    - Log entry with full nutrition breakdown
    - Updated daily totals
    """
    try:
        # Get nutrition data
        nutrition = calculate_nutrition_for_portion(request.food_name, request.portion_grams)
        
        if not nutrition:
            raise HTTPException(
                status_code=404,
                detail=f"Food '{request.food_name}' not found in database. Try a similar food name."
            )
        
        # Create log entry - store notes in macros_json as well for compatibility
        macros_data = {
            "protein": nutrition["protein"],
            "carbs": nutrition["carbs"],
            "fats": nutrition["fats"],
            "fiber": nutrition["fiber"],
            "meal_type": request.meal_type,
            "portion_grams": request.portion_grams,
            "meal_time": request.meal_time,
            "notes": request.notes,  # Store notes in macros_json too
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
            "meal_type": request.meal_type,
            "nutrition": {
                "calories": round(nutrition["calories"], 1),
                "protein": round(nutrition["protein"], 1),
                "carbs": round(nutrition["carbs"], 1),
                "fats": round(nutrition["fats"], 1),
                "fiber": round(nutrition["fiber"], 1),
            },
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


# ====================== FOOD SEARCH & LOOKUP ======================

@router.get("/search-food/{food_name}")
async def search_food(
    food_name: str,
    portion_grams: float = Query(100),
    current_user: User = Depends(require_role(["trainee"]))
):
    """
    Search for food in database
    
    Returns nutrition data for specified portion
    """
    nutrition = calculate_nutrition_for_portion(food_name, portion_grams)
    
    if not nutrition:
        return {
            "found": False,
            "message": f"'{food_name}' not found. Try: chicken, rice, eggs, milk, yogurt, etc.",
            "suggestions": ["chicken", "rice", "eggs", "milk", "salad", "vegetables"]
        }
    
    return {
        "found": True,
        "food": nutrition["food"],
        "nutrition_per_100g": get_nutrition_per_100g(food_name),
        "nutrition": nutrition
    }


# ====================== DAILY SUMMARY & TRACKING ======================

@router.get("/daily-summary")
async def get_daily_nutrition(
    target_date: Optional[str] = None,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """
    Get nutrition summary for a specific day with:
    - Daily totals
    - Remaining macros
    - Progress towards goals
    - AI recommendations
    """
    try:
        if target_date:
            try:
                query_date = datetime.fromisoformat(target_date).date()
            except:
                raise HTTPException(status_code=400, detail="Invalid date format")
        else:
            query_date = datetime.utcnow().date()
        
        # Get logs for the day
        logs = db.query(NutritionLog).filter(
            NutritionLog.trainee_id == current_user.id,
            NutritionLog.date >= query_date,
            NutritionLog.date < query_date + timedelta(days=1)
        ).all()
        
        # Calculate totals
        totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "fiber": 0,
        }
        
        meals = []
        for log in logs:
            totals["calories"] += log.calories or 0
            if log.macros_json:
                totals["protein"] += log.macros_json.get("protein", 0)
                totals["carbs"] += log.macros_json.get("carbs", 0)
                totals["fats"] += log.macros_json.get("fats", 0)
                totals["fiber"] += log.macros_json.get("fiber", 0)
      
            meals.append({
                "id": log.id,
                "food": log.item,
                "portion_grams": log.macros_json.get("portion_grams", 0) if log.macros_json else 0,
                "meal_type": log.macros_json.get("meal_type", "snack") if log.macros_json else "snack",
                "calories": log.calories,
                "nutrition": {
                    "protein": log.macros_json.get("protein", 0) if log.macros_json else 0,
                    "carbs": log.macros_json.get("carbs", 0) if log.macros_json else 0,
                    "fats": log.macros_json.get("fats", 0) if log.macros_json else 0,
                    "fiber": log.macros_json.get("fiber", 0) if log.macros_json else 0,
                },
                "logged_at": log.created_at.isoformat() if log.created_at else None
            })
        
        # Get personalized goals
        trainee_profile = current_user.trainee_profile
        user_profile = {
            "weight": trainee_profile.weight if trainee_profile and trainee_profile.weight else 70,
            "height": trainee_profile.height if trainee_profile and trainee_profile.height else 170,
            "age": 30,  # Default age if not available
            "gender": trainee_profile.gender if trainee_profile and trainee_profile.gender else "M",
            "activity_level": "moderate",
            "fitness_goal": "maintain",
        }
        
        goals = calculate_daily_nutrition_goals(user_profile)
        
        # Calculate remaining
        remaining = {
            "calories": max(goals["calories"] - totals["calories"], 0),
            "protein": max(goals["protein"] - totals["protein"], 0),
            "carbs": max(goals["carbs"] - totals["carbs"], 0),
            "fats": max(goals["fats"] - totals["fats"], 0),
            "fiber": max(goals["fiber"] - totals["fiber"], 0),
        }
        
        # Get recommendations
        recommendations = get_nutrition_recommendations(totals, goals)
        
        # Calculate progress percentages with division by zero protection
        progress = {}
        for key in ["calories", "protein", "carbs", "fats"]:
            if goals.get(key, 0) > 0:
                progress[f"{key}_percent"] = min((totals[key] / goals[key]) * 100, 100)
            else:
                progress[f"{key}_percent"] = 0
        
        return {
            "date": query_date.isoformat(),
            "meals": meals,
            "totals": {k: round(v, 1) for k, v in totals.items()},
            "goals": {k: round(v, 1) if k != "tdee" and k != "bmr" else v for k, v in goals.items()},
            "remaining": {k: round(v, 1) for k, v in remaining.items()},
            "progress": progress,
            "recommendations": recommendations,
            "logs_count": len(logs)
        }
    except Exception as e:
        import traceback
        print(f"Daily nutrition error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error calculating daily nutrition: {str(e)}")


# ====================== WEEKLY TRACKING & ANALYTICS ======================

@router.get("/weekly-summary")
async def get_weekly_nutrition(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """
    Get weekly nutrition summary for charts and analytics
    
    Returns: Last N days with daily aggregates
    """
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days - 1)
    
    logs = db.query(NutritionLog).filter(
        NutritionLog.trainee_id == current_user.id,
        NutritionLog.date >= start_date
    ).all()
    
    # Aggregate by day
    daily_data = {}
    for log in logs:
        day_key = (log.date or today).isoformat()
        
        if day_key not in daily_data:
            daily_data[day_key] = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "fiber": 0,
                "meals_count": 0
            }
        
        daily_data[day_key]["calories"] += log.calories or 0
        if log.macros_json:
            daily_data[day_key]["protein"] += log.macros_json.get("protein", 0)
            daily_data[day_key]["carbs"] += log.macros_json.get("carbs", 0)
            daily_data[day_key]["fats"] += log.macros_json.get("fats", 0)
            daily_data[day_key]["fiber"] += log.macros_json.get("fiber", 0)
        daily_data[day_key]["meals_count"] += 1
    
    # Build response for all days (including empty ones)
    daily_array = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        
        data = daily_data.get(d_str, {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0,
            "fiber": 0,
            "meals_count": 0
        })
        
        daily_array.append({
            "date": d_str,
            **data
        })
    
    # Calculate averages
    total_calories = sum(d["calories"] for d in daily_array)
    avg_calories = total_calories / days if days > 0 else 0
    
    return {
        "start_date": start_date.isoformat(),
        "end_date": today.isoformat(),
        "days": days,
        "daily": daily_array,
        "statistics": {
            "total_calories": round(total_calories, 1),
            "average_calories_per_day": round(avg_calories, 1),
            "days_logged": len([d for d in daily_array if d["meals_count"] > 0]),
            "consistency": f"{(len([d for d in daily_array if d['meals_count'] > 0]) / days * 100):.0f}%"
        }
    }


# ====================== DELETE LOG ======================

@router.delete("/log/{log_id}")
async def delete_nutrition_log(
    log_id: int,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Delete a nutrition log entry"""
    log = db.query(NutritionLog).filter(
        NutritionLog.id == log_id,
        NutritionLog.trainee_id == current_user.id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    
    try:
        db.delete(log)
        db.commit()
        return {"status": "success", "message": "Log deleted", "id": log_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


# ====================== NUTRITION GOALS & PERSONALIZATION ======================

@router.get("/goals")
async def get_nutrition_goals(
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get personalized nutrition goals for user"""
    user_profile = {
        "weight": current_user.trainee_profile.weight if current_user.trainee_profile else 70,
        "height": current_user.trainee_profile.height if current_user.trainee_profile else 170,
        "age": current_user.age or 30,
        "gender": current_user.gender or "M",
        "activity_level": current_user.trainee_profile.activity_level if current_user.trainee_profile else "moderate",
        "fitness_goal": current_user.trainee_profile.fitness_goal if current_user.trainee_profile else "maintain",
    }
    
    goals = calculate_daily_nutrition_goals(user_profile)
    
    return {
        "user_profile": user_profile,
        "daily_goals": {k: round(v, 1) if isinstance(v, (int, float)) else v for k, v in goals.items()}
    }


@router.post("/goals")
async def update_nutrition_goals(
    request: NutritionGoalsUpdate,
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Update user profile and recalculate nutrition goals"""
    if current_user.trainee_profile:
        current_user.trainee_profile.weight = request.weight
        current_user.trainee_profile.height = request.height
        current_user.trainee_profile.activity_level = request.activity_level
        current_user.trainee_profile.fitness_goal = request.fitness_goal
        
        if request.age:
            current_user.age = request.age
        if request.gender:
            current_user.gender = request.gender
        
        db.commit()
    
    goals = calculate_daily_nutrition_goals({
        "weight": request.weight,
        "height": request.height,
        "age": request.age or current_user.age or 30,
        "gender": request.gender or current_user.gender or "M",
        "activity_level": request.activity_level,
        "fitness_goal": request.fitness_goal,
    })
    
    return {
        "status": "success",
        "message": "Goals updated",
        "daily_goals": {k: round(v, 1) if isinstance(v, (int, float)) else v for k, v in goals.items()}
    }


# ====================== MEAL SUGGESTIONS & MEAL PREP ======================

@router.get("/suggest-meals")
async def get_meal_suggestions(
    target_protein: float = Query(100),
    target_carbs: float = Query(250),
    target_fats: float = Query(70),
    current_user: User = Depends(require_role(["trainee"]))
):
    """Get meal suggestions to hit specific macro targets"""
    suggestions = suggest_meals_for_macros(target_protein, target_carbs, target_fats)
    
    return {
        "target_macros": {
            "protein": target_protein,
            "carbs": target_carbs,
            "fats": target_fats
        },
        "suggestions": suggestions
    }


@router.get("/meal-prep-plan")
async def get_meal_plan(
    days: int = Query(7, ge=1, le=30),
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get personalized meal prep plan for specified days"""
    # Get user goals
    user_profile = {
        "weight": current_user.trainee_profile.weight if current_user.trainee_profile else 70,
        "height": current_user.trainee_profile.height if current_user.trainee_profile else 170,
        "age": current_user.age or 30,
        "gender": current_user.gender or "M",
        "activity_level": current_user.trainee_profile.activity_level if current_user.trainee_profile else "moderate",
        "fitness_goal": current_user.trainee_profile.fitness_goal if current_user.trainee_profile else "maintain",
    }
    
    goals = calculate_daily_nutrition_goals(user_profile)
    plan = get_meal_prep_plan(goals, days)
    
    return {
        "daily_goals": goals,
        "plan": plan,
        "total_days": days
    }


# ====================== GET ALL LOGS ======================

@router.get("/logs")
async def get_nutrition_logs(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(["trainee"])),
    db: Session = Depends(get_db)
):
    """Get all nutrition logs with pagination"""
    try:
        logs = db.query(NutritionLog).filter(
            NutritionLog.trainee_id == current_user.id
        ).order_by(NutritionLog.created_at.desc()).offset(offset).limit(limit).all()
        
        result_logs = []
        for log in logs:
            # Try to get meal_type from column or from macros_json
            meal_type = getattr(log, 'meal_type', None)
            if not meal_type and log.macros_json and isinstance(log.macros_json, dict):
                meal_type = log.macros_json.get('meal_type', 'other')
            
            result_logs.append({
                "id": log.id,
                "food": log.item,
                "item": log.item,
                "calories": log.calories,
                "macros": log.macros_json or {},
                "nutrition": log.macros_json or {},
                "date": log.created_at.isoformat() if log.created_at else None,
                "logged_at": log.created_at.isoformat() if log.created_at else None,
                "meal_type": meal_type or "other",
                "notes": getattr(log, 'notes', None)
            })
        
        return {
            "logs": result_logs,
            "count": len(result_logs),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        import traceback
        print(f"Error in get_nutrition_logs: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")
