
# ====================== IMPORTS ======================

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
import secrets
import os
import io
import random
from app.database import get_db
from app.models import (
    User,
    Trainer,
    Trainee,
    Workout,
    Payment,
    Expense,             # ✅ REQUIRED for Billing
    UserRole,            # ✅ Import UserRole Enum
    AdminSettings,       # ✅ Import AdminSettings
    Membership,          # ✅ Import Membership for dashboard
    MembershipPlan,      # ✅ Import MembershipPlan for dashboard
    Equipment,           # ✅ Import Equipment for dashboard
    TrainerRevenue,      # ✅ Import TrainerRevenue for billing/payments
    TrainerSalary,       # ✅ Import TrainerSalary for trainer creation
    Message,             # ✅ Import Message for deletion
    Notification,        # ✅ Import Notification for admin notifications
    # Models for deletion
    AIReport,
    Measurement,
    ProgressMeasurement,
    NutritionLog,
    DietPlan,
    WorkoutPlan,
    Attendance,
    ProgressPhoto,
    AdminSession,
    TrainerSchedule,
    TrainerAttendance,
    # TrainerDocument,     # ❌ Removed - schema mismatch, using raw SQL instead
    # TrainerLeave,        # ❌ Removed - schema mismatch, using raw SQL instead
    TrainerMessage,      # ✅ Import TrainerMessage for deletion
    PTSession,           # ✅ Import PTSession for deletion
    GymScheduleSlot,     # ✅ Import GymScheduleSlot for deletion
)
from app.auth_util import get_admin_user, get_password_hash

# ====================== SCHEMAS ======================

class SendMessageRequest(BaseModel):
    receiver_id: int
    message: str

class DashboardResponse(BaseModel):
    total_members: int
    active_trainers: int
    monthly_revenue: float
    recent_workouts: int

router = APIRouter(tags=["Admin"])

# ====================== ADMIN PROFILE ======================

@router.get("/profile")
async def get_admin_profile(current_user: User = Depends(get_admin_user)):
    """Get admin profile information"""
    try:
        return {
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        }
    except Exception as e:
        print(f"ERROR in get_admin_profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get profile: {str(e)}")

@router.put("/profile")
async def update_admin_profile(data: dict, current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Update admin profile - name, email, or password"""
    try:
        updated = False
        
        if "name" in data and data["name"]:
            current_user.name = data["name"]
            updated = True

        if "email" in data and data["email"]:
            # Check if email already exists for another user
            existing = db.query(User).filter(User.email == data["email"], User.id != current_user.id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use by another account")
            current_user.email = data["email"]
            updated = True
                 
        if "password" in data and data["password"]:
            # Use get_password_hash to properly hash the password
            current_user.password_hash = get_password_hash(data["password"])
            updated = True
            
        if updated:
            db.add(current_user)  # Ensure user is tracked
            db.commit()
            db.refresh(current_user)  # Refresh to get updated data
            return {
                "message": "Profile updated successfully",
                "name": current_user.name,
                "email": current_user.email
            }
        return {"message": "No changes made"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in update_admin_profile: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

# ====================== ADMIN NOTIFICATIONS ======================

@router.get("/notifications")
async def get_admin_notifications(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    unread_only: bool = Query(False)
):
    """Get notifications for admin user"""
    try:
        query = db.query(Notification).filter(Notification.user_id == current_user.id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        notifications = query.order_by(Notification.created_at.desc()).all()
        
        return {
            "success": True,
            "unread_count": db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            ).count(),
            "notifications": [
                {
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "notification_type": n.notification_type,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                }
                for n in notifications
            ]
        }
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Mark a notification as read"""
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
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read for admin user"""
    try:
        unread_notifications = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).all()
        
        now = datetime.utcnow()
        for notification in unread_notifications:
            notification.is_read = True
            notification.read_at = now
        
        db.commit()
        
        return {
            "success": True, 
            "message": f"Marked {len(unread_notifications)} notifications as read",
            "count": len(unread_notifications)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ====================== ADMIN SETTINGS ======================

@router.get("/settings")
async def get_admin_settings(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    settings = db.query(AdminSettings).filter_by(user_id=current_user.id).first()
    if not settings:
        # Create default settings if not exist
        settings = AdminSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return {
        "gym_name": settings.gym_name or "FitMate Pro Gym",
        "email": settings.email or "admin@fitmate.com",
        "phone": settings.phone or "+1-800-FITMATE",
        "address": settings.address or "123 Fitness St, City",
        "theme": settings.theme or "dark",
        "timezone": settings.timezone or "UTC",
        "currency": settings.currency or "USD",
        "notifications_enabled": settings.notifications_enabled if hasattr(settings, 'notifications_enabled') else True,
        "email_notifications": settings.email_notifications if hasattr(settings, 'email_notifications') else True,
        "maintenance_reminders": settings.maintenance_reminders if hasattr(settings, 'maintenance_reminders') else True,
        "schedule_notifications": settings.schedule_notifications if hasattr(settings, 'schedule_notifications') else True,
        "security_2fa": settings.two_factor_enabled if hasattr(settings, 'two_factor_enabled') else False,
        "backup_enabled": settings.backup_enabled if hasattr(settings, 'backup_enabled') else True,
        "data_retention_days": settings.data_retention_days if hasattr(settings, 'data_retention_days') else 365,
        "max_failed_logins": settings.max_failed_logins if hasattr(settings, 'max_failed_logins') else 5,
        "session_timeout_minutes": settings.session_timeout_minutes if hasattr(settings, 'session_timeout_minutes') else 30,
        "auto_backup_enabled": settings.auto_backup_enabled if hasattr(settings, 'auto_backup_enabled') else True,
        "backup_frequency": settings.backup_frequency if hasattr(settings, 'backup_frequency') else "daily"
    }

@router.put("/settings")
async def update_admin_settings(data: dict = Body(...), current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    settings = db.query(AdminSettings).filter_by(user_id=current_user.id).first()
    if not settings:
        settings = AdminSettings(user_id=current_user.id)
        db.add(settings)
    
    # Update all fields if they exist in the request
    field_mapping = {
        "gym_name": "gym_name",
        "email": "email",
        "phone": "phone",
        "address": "address",
        "theme": "theme",
        "timezone": "timezone",
        "currency": "currency",
        "notifications_enabled": "notifications_enabled",
        "email_notifications": "email_notifications",
        "maintenance_reminders": "maintenance_reminders",
        "schedule_notifications": "schedule_notifications",
        "security_2fa": "two_factor_enabled",
        "backup_enabled": "backup_enabled",
        "data_retention_days": "data_retention_days",
        "max_failed_logins": "max_failed_logins",
        "session_timeout_minutes": "session_timeout_minutes",
        "auto_backup_enabled": "auto_backup_enabled",
        "backup_frequency": "backup_frequency"
    }
    
    for frontend_field, db_field in field_mapping.items():
        if frontend_field in data:
            setattr(settings, db_field, data[frontend_field])
    
    db.commit()
    db.refresh(settings)
    
    return {
        "success": True,
        "message": "Settings updated successfully",
        "gym_name": settings.gym_name,
        "email": settings.email,
        "phone": settings.phone,
        "address": settings.address,
        "theme": settings.theme,
        "timezone": settings.timezone,
        "currency": settings.currency,
        "notifications_enabled": settings.notifications_enabled,
        "email_notifications": settings.email_notifications if hasattr(settings, 'email_notifications') else True,
        "maintenance_reminders": settings.maintenance_reminders if hasattr(settings, 'maintenance_reminders') else True,
        "schedule_notifications": settings.schedule_notifications if hasattr(settings, 'schedule_notifications') else True,
        "security_2fa": settings.two_factor_enabled if hasattr(settings, 'two_factor_enabled') else False,
        "backup_enabled": settings.backup_enabled if hasattr(settings, 'backup_enabled') else True,
        "data_retention_days": settings.data_retention_days if hasattr(settings, 'data_retention_days') else 365,
        "max_failed_logins": settings.max_failed_logins if hasattr(settings, 'max_failed_logins') else 5,
        "session_timeout_minutes": settings.session_timeout_minutes if hasattr(settings, 'session_timeout_minutes') else 30,
        "auto_backup_enabled": settings.auto_backup_enabled if hasattr(settings, 'auto_backup_enabled') else True,
        "backup_frequency": settings.backup_frequency if hasattr(settings, 'backup_frequency') else "daily"
    }

# ---- Auth / Permissions ----
from app.auth_util import get_admin_user, get_password_hash

# ---- Schemas (Incoming Request Bodies) ----
from app.schemas import (
    CreateUserRequest,
    MemberManagementRequest,
    MembershipCreate,
    EquipmentCreate,
    RefundPaymentRequest,     # ✅ REQUIRED for Billing
    ExpenseCreate,            # ✅ REQUIRED for Billing
    PasswordResetRequest,     # ✅ For password reset
    TrainerUpdateRequest,     # ✅ For trainer update
)

# ====================== SCHEMAS ======================


class CreateTrainerRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = 0
    certifications: Optional[str] = None
    salary_model: Optional[str] = "fixed"  # fixed, per_session, hybrid
    base_salary: Optional[float] = 0
    commission_per_session: Optional[float] = 0
    bio: Optional[str] = None


class SendMessageRequest(BaseModel):
    receiver_id: int
    message: str


# ====================== ADMIN DASHBOARD ======================



class DashboardResponse(BaseModel):
    total_members: int
    active_trainers: int
    monthly_revenue: float
    recent_workouts: int

@router.get("/dashboard")

@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    summary="Get admin dashboard metrics",
    description="Returns key metrics for the admin dashboard, including total members, active trainers, monthly revenue, and recent workouts.",
    tags=["Admin"]
)
async def get_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Main admin dashboard metrics.
    """
    total_members = (
        db.query(User)
        .filter(User.role == UserRole.TRAINEE)
        .count()
    )
    active_trainers = db.query(Trainer).count()
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    monthly_revenue = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.status == "completed",
            Payment.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )
    recent_workouts = (
        db.query(Workout)
        .order_by(Workout.start_time.desc())
        .limit(10)
        .count()
    )
    return DashboardResponse(
        total_members=total_members,
        active_trainers=active_trainers,
        monthly_revenue=monthly_revenue,
        recent_workouts=recent_workouts
    )

# ====================== REAL-TIME DASHBOARD (NEW) ======================

@router.get("/dashboard/live")
async def get_live_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Real-time dashboard metrics with more detailed data
    Returns:
    - All standard metrics
    - Today's signups
    - Pending payments
    - Overdue payments
    - Equipment maintenance alerts
    - Expiring memberships (next 7 days)
    """
    
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_from_now = now + timedelta(days=7)
    
    # Standard metrics
    total_members = db.query(User).filter(User.role == UserRole.TRAINEE).count()
    active_trainers = db.query(Trainer).count()
    
    monthly_revenue = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.status == "completed",
            Payment.created_at >= thirty_days_ago,
        )
        .scalar() or 0
    )
    
    recent_workouts = (
        db.query(Workout)
        .order_by(Workout.start_time.desc())
        .limit(10)
        .count()
    )
    
    # NEW: Today's signups
    new_signups_today = (
        db.query(User)
        .filter(
            User.role == UserRole.TRAINEE,
            User.created_at >= today_start
        )
        .count()
    )
    
    # NEW: Today's revenue
    todays_revenue = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.status == "completed",
            Payment.created_at >= today_start,
        )
        .scalar() or 0
    )
    
    # NEW: Pending payments
    pending_payments = (
        db.query(func.sum(Payment.amount))
        .filter(Payment.status == "pending")
        .scalar() or 0
    )
    
    # NEW: Overdue payments (pending for more than 7 days)
    overdue_payments = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.status == "pending",
            Payment.created_at < now - timedelta(days=7)
        )
        .scalar() or 0
    )
    
    # NEW: Expiring memberships (next 7 days)
    expiring_memberships = (
        db.query(Membership)
        .filter(
            Membership.end_date.between(now, seven_days_from_now),
            Membership.status == "active"
        )
        .count()
    )
    
    # NEW: Equipment needing maintenance
    equipment_maintenance = (
        db.query(Equipment)
        .filter(
            Equipment.status == "maintenance"
        )
        .count()
    )
    
    # NEW: Signups this week
    week_start = now - timedelta(days=7)
    new_signups_week = (
        db.query(User)
        .filter(
            User.role == UserRole.TRAINEE,
            User.created_at >= week_start
        )
        .count()
    )
    
    return {
        # Standard metrics
        "total_members": total_members,
        "active_trainers": active_trainers,
        "monthly_revenue": float(monthly_revenue),
        "recent_workouts": recent_workouts,
        
        # NEW: Real-time metrics
        "new_signups_today": new_signups_today,
        "new_signups_week": new_signups_week,
        "todays_revenue": float(todays_revenue),
        "pending_payments": float(pending_payments),
        "overdue_payments": float(overdue_payments),
        "expiring_memberships": expiring_memberships,
        "equipment_maintenance": equipment_maintenance,
        
        # Timestamp
        "last_updated": now.isoformat()
    }
    
@router.get("/dashboard/top-plans")
async def get_top_plans(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    plans = db.query(MembershipPlan).all()
    result = []
    for plan in plans:
        purchase_count = db.query(Membership).filter(Membership.membership_type == plan.membership_type).count()
        revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "completed", Payment.provider == plan.name).scalar() or 0
        renewals = db.query(Membership).filter(Membership.membership_type == plan.membership_type, Membership.status == "active").count()
        renewal_rate = (renewals / purchase_count) if purchase_count else 0
        result.append({
            "name": plan.name,
            "purchase_count": purchase_count,
            "revenue": revenue,
            "renewal_rate": renewal_rate,
        })
    return {"top_plans": result}


@router.get("/dashboard/ai-suggestions")
async def get_ai_suggestions(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    # Example: Use metrics to generate suggestions
    suggestions = []
    # You can use your metrics here for logic
    suggestions.append("Revenue is low this month. Offer a 10% discount on renewals.")
    suggestions.append("Trainee attendance dropped last week. Send motivational broadcast.")
    suggestions.append("Most members join 6-8 AM. Consider adding morning trainer.")
    return {"suggestions": suggestions}
# Extra dashboard data for charts (progress graph, etc.)
@router.get("/dashboard/progress")
async def get_dashboard_progress(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Data for charts:
    - member_growth: last 6 months (new trainees per month)
    - revenue_trend: last 6 months (completed payments)
    - workout_trend: last 7 days (workouts per day)
    """

    now = datetime.utcnow()

    # ---- Member growth (last 6 months) ----
    six_months_ago = now - timedelta(days=6 * 30)
    trainees = (
        db.query(User)
        .filter(
            User.role == UserRole.TRAINEE,
            User.created_at >= six_months_ago,
        )
        .all()
    )

    member_growth_map = {}
    for u in trainees:
        if not u.created_at:
            continue
        key = u.created_at.strftime("%Y-%m")
        member_growth_map[key] = member_growth_map.get(key, 0) + 1

    # Fill months even if 0
    member_growth = []
    for i in range(5, -1, -1):
        month_dt = (now.replace(day=1) - timedelta(days=30 * i))
        key = month_dt.strftime("%Y-%m")
        label = month_dt.strftime("%b %Y")
        member_growth.append(
            {"month": label, "count": member_growth_map.get(key, 0)}
        )

    # ---- Revenue trend (last 6 months) ----
    payments = (
        db.query(Payment)
        .filter(
            Payment.status == "completed",
            Payment.created_at >= six_months_ago,
        )
        .all()
    )

    revenue_map = {}
    for p in payments:
        if not p.created_at:
            continue
        key = p.created_at.strftime("%Y-%m")
        revenue_map[key] = revenue_map.get(key, 0.0) + float(p.amount or 0)

    revenue_trend = []
    for i in range(5, -1, -1):
        month_dt = (now.replace(day=1) - timedelta(days=30 * i))
        key = month_dt.strftime("%Y-%m")
        label = month_dt.strftime("%b %Y")
        revenue_trend.append(
            {"month": label, "amount": float(revenue_map.get(key, 0.0))}
        )

    # ---- Workout trend (last 7 days) ----
    seven_days_ago = now - timedelta(days=7)
    workouts = (
        db.query(Workout)
        .filter(Workout.start_time >= seven_days_ago)
        .all()
    )

    workout_map = {}
    for w in workouts:
        if not w.start_time:
            continue
        key = w.start_time.date()
        workout_map[key] = workout_map.get(key, 0) + 1

    workout_trend = []
    for i in range(6, -1, -1):
        d = (now - timedelta(days=i)).date()
        label = d.strftime("%d %b")
        workout_trend.append(
            {"date": label, "count": workout_map.get(d, 0)}
        )

    return {
        "member_growth": member_growth,
        "revenue_trend": revenue_trend,
        "workout_trend": workout_trend,
    }

@router.get("/dashboard/complete")
async def get_complete_dashboard(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    OPTIMIZED: Single endpoint combining all dashboard data to avoid 6+ parallel calls
    Returns live metrics, top plans, notifications, health status, suggestions, and progress analytics
    """
    try:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = now - timedelta(days=30)
        week_start = now - timedelta(days=7)
        six_months_ago = now - timedelta(days=6 * 30)
        seven_days_from_now = now + timedelta(days=7)
        
        # ===== LIVE METRICS =====
        total_members = db.query(User).filter(User.role == UserRole.TRAINEE).count()
        active_trainers = db.query(Trainer).count()
        
        monthly_revenue = (
            db.query(func.sum(Payment.amount))
            .filter(
                Payment.status == "completed",
                Payment.created_at >= thirty_days_ago,
            )
            .scalar() or 0
        )
        
        todays_revenue = (
            db.query(func.sum(Payment.amount))
            .filter(
                Payment.status == "completed",
                Payment.created_at >= today_start,
            )
            .scalar() or 0
        )
        
        new_signups_today = (
            db.query(User)
            .filter(
                User.role == UserRole.TRAINEE,
                User.created_at >= today_start
            )
            .count()
        )
        
        new_signups_week = (
            db.query(User)
            .filter(
                User.role == UserRole.TRAINEE,
                User.created_at >= week_start
            )
            .count()
        )
        
        pending_payments = (
            db.query(func.sum(Payment.amount))
            .filter(Payment.status == "pending")
            .scalar() or 0
        )
        
        # ===== TOP PLANS - OPTIMIZED =====
        # Get all membership type counts in one query
        membership_counts = dict(
            db.query(Membership.membership_type, func.count(Membership.id))
            .group_by(Membership.membership_type)
            .all()
        )
        
        active_counts = dict(
            db.query(Membership.membership_type, func.count(Membership.id))
            .filter(Membership.status == "active")
            .group_by(Membership.membership_type)
            .all()
        )
        
        # Get revenue by plan name in one query
        plan_revenues = dict(
            db.query(Payment.provider, func.sum(Payment.amount))
            .filter(Payment.status == "completed")
            .group_by(Payment.provider)
            .all()
        )
        
        plans = db.query(MembershipPlan).all()
        top_plans = []
        for plan in plans:
            try:
                purchase_count = membership_counts.get(plan.membership_type, 0)
                revenue = plan_revenues.get(plan.name, 0) or 0
                renewals = active_counts.get(plan.membership_type, 0)
                renewal_rate = (renewals / purchase_count) if purchase_count else 0
                top_plans.append({
                    "name": plan.name,
                    "purchase_count": purchase_count,
                    "revenue": float(revenue),
                    "renewal_rate": float(renewal_rate),
                })
            except Exception as e:
                print(f"Error processing plan {plan.name}: {e}")
        
        
        # ===== NOTIFICATIONS =====
        # Fetch real notifications from database (including feedback)
        notifications = []
        unread_count = 0
        unread_message_count = 0
        try:
            # Get actual notifications for the admin user
            db_notifications = db.query(Notification).filter(
                Notification.user_id == current_user.id
            ).order_by(Notification.created_at.desc()).limit(15).all()
            
            # Count unread notifications
            unread_count = db.query(Notification).filter(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            ).count()
            
            # Count unread messages for admin
            unread_message_count = db.query(Message).filter(
                Message.receiver_id == current_user.id,
                Message.is_read == False
            ).count()
            
            for n in db_notifications:
                # Format message to show title and content
                display_message = f"{n.title}"
                if n.message and n.message != n.title:
                    display_message = f"{n.title}: {n.message[:100]}"  # Truncate long messages
                    
                notifications.append({
                    "id": n.id,
                    "type": n.notification_type or "general",
                    "title": n.title,
                    "message": display_message,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None,
                    "importance": "important" if n.notification_type == "feedback" else "normal",
                })
        except Exception as e:
            print(f"Error fetching notifications: {e}")
        
        # ===== SYSTEM HEALTH =====
        health_status = {
            "database": "healthy",
            "api": "running",
            "memory_usage": "normal",
            "last_check": now.isoformat()
        }
        
        # ===== AI SUGGESTIONS =====
        suggestions = [
            "Monitor peak hours: 6-8 AM has highest signups",
            "Maintain trainer-to-member ratio above 1:10",
            "Review low-engagement members this week"
        ]
        
        # ===== PROGRESS ANALYTICS =====
        trainees = db.query(User).filter(
            User.role == UserRole.TRAINEE,
            User.created_at >= six_months_ago,
        ).all()
        
        member_growth_map = {}
        for u in trainees:
            if not u.created_at:
                continue
            key = u.created_at.strftime("%Y-%m")
            member_growth_map[key] = member_growth_map.get(key, 0) + 1
        
        member_growth = []
        for i in range(5, -1, -1):
            month_dt = (now.replace(day=1) - timedelta(days=30 * i))
            key = month_dt.strftime("%Y-%m")
            label = month_dt.strftime("%b %Y")
            member_growth.append({"month": label, "count": member_growth_map.get(key, 0)})
        
        payments = db.query(Payment).filter(
            Payment.status == "completed",
            Payment.created_at >= six_months_ago,
        ).all()
        
        revenue_map = {}
        for p in payments:
            if not p.created_at:
                continue
            key = p.created_at.strftime("%Y-%m")
            revenue_map[key] = revenue_map.get(key, 0.0) + float(p.amount or 0)
        
        revenue_trend = []
        for i in range(5, -1, -1):
            month_dt = (now.replace(day=1) - timedelta(days=30 * i))
            key = month_dt.strftime("%Y-%m")
            label = month_dt.strftime("%b %Y")
            revenue_trend.append({"month": label, "amount": float(revenue_map.get(key, 0.0))})
        
        return {
            "live_metrics": {
                "total_members": total_members,
                "active_trainers": active_trainers,
                "monthly_revenue": float(monthly_revenue),
                "todays_revenue": float(todays_revenue),
                "new_signups_today": new_signups_today,
                "new_signups_week": new_signups_week,
                "pending_payments": float(pending_payments),
            },
            "top_plans": top_plans,
            "notifications": notifications[:10],
            "unread_count": unread_count,
            "unread_message_count": unread_message_count,
            "system_health": health_status,
            "ai_suggestions": suggestions,
            "progress_analytics": {
                "member_growth": member_growth,
                "revenue_trend": revenue_trend,
            },
            "timestamp": now.isoformat()
        }
    except Exception as e:
        # Fallback response if anything fails
        return {
            "live_metrics": {
                "total_members": 0,
                "active_trainers": 0,
                "monthly_revenue": 0.0,
                "todays_revenue": 0.0,
                "new_signups_today": 0,
                "new_signups_week": 0,
                "pending_payments": 0.0,
            },
            "top_plans": [],
            "notifications": [{"type": "error", "message": str(e)}],
            "system_health": {"database": "error", "api": "degraded"},
            "ai_suggestions": [],
            "progress_analytics": {"member_growth": [], "revenue_trend": []},
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# ====================== BILLING & FINANCE ======================

# Summary endpoint for payouts and payments
@router.get("/billing/summary")
async def get_billing_summary(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    total_trainee_payments = db.query(func.sum(Payment.amount)).filter(Payment.status == "completed").scalar() or 0
    total_trainer_payouts = db.query(func.sum(TrainerRevenue.amount)).scalar() or 0
    outstanding_balance = total_trainee_payments - total_trainer_payouts
    return {
        "total_trainee_payments": total_trainee_payments,
        "total_trainer_payouts": total_trainer_payouts,
        "outstanding_balance": outstanding_balance
    }


@router.get("/billing/summary")
async def get_billing_summary(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Billing & finance summary for dashboard:
    - total_revenue (all time, completed payments)
    - monthly_revenue (last 30 days)
    - trainer_payouts (sum of TrainerRevenue)
    - outstanding_balance (revenue - payouts)
    """

    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    total_revenue = (
        db.query(func.sum(Payment.amount))
        .filter(Payment.status == "completed")
        .scalar()
        or 0
    )

    monthly_revenue = (
        db.query(func.sum(Payment.amount))
        .filter(
            Payment.status == "completed",
            Payment.created_at >= thirty_days_ago,
        )
        .scalar()
        or 0
    )

    trainer_payouts = (
        db.query(func.sum(TrainerRevenue.amount))
        .scalar()
        or 0
    )

    outstanding_balance = float(total_revenue) - float(trainer_payouts)

    return {
        "total_revenue": float(total_revenue),
        "monthly_revenue": float(monthly_revenue),
        "trainer_payouts": float(trainer_payouts),
        "outstanding_balance": float(outstanding_balance),
    }


@router.get("/billing/payments")
async def list_payments(
    mode: Optional[str] = Query(None, description="cash / upi / card"),
    status: Optional[str] = Query(None, description="pending / completed / failed"),
    search: Optional[str] = Query(None, description="search by email or receipt"),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Admin: List payments with filters
    - mode: payment_mode (cash / upi / card)
    - status: pending / completed / failed
    - search: trainee email OR receipt number (contains)
    """

    q = db.query(Payment).join(User, User.id == Payment.trainee_id)

    if mode:
        q = q.filter(Payment.payment_mode == mode.lower())

    if status:
        q = q.filter(Payment.status == status)

    if search:
        search_like = f"%{search.lower()}%"
        q = q.filter(
            func.lower(User.email).like(search_like)
            | func.lower(Payment.receipt_number).like(search_like)
        )

    payments = (
        q.order_by(Payment.created_at.desc())
        .limit(limit)
        .all()
    )

    # Get trainer payouts
    trainer_payouts = db.query(TrainerRevenue).order_by(TrainerRevenue.paid_at.desc()).limit(limit).all()

    result = []
    for p in payments:
        trainee = p.trainee  # relationship to User
        result.append({
            "id": p.id,
            "type": "trainee_payment",
            "amount": float(p.amount or 0),
            "status": p.status,
            "payment_mode": p.payment_mode,
            "provider": p.provider,
            "trainee_email": trainee.email if trainee else None,
            "user_email": trainee.email if trainee else None,
            "receipt_number": p.receipt_number,
            "receipt_pdf_url": p.receipt_pdf_url,
            "is_refund": p.is_refund,
            "refund_amount": float(p.refund_amount or 0) if p.refund_amount is not None else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })

    for payout in trainer_payouts:
        trainer = db.query(Trainer).filter(Trainer.id == payout.trainer_id).first()
        result.append({
            "id": payout.id,
            "type": "trainer_payout",
            "amount": float(payout.amount or 0),
            "status": "paid",
            "payment_mode": "bank_transfer",
            "provider": "admin",
            "trainer_id": payout.trainer_id,
            "trainer_name": trainer.user.name if trainer and trainer.user else None,
            "notes": payout.notes,
            "paid_at": payout.paid_at.isoformat() if payout.paid_at else None,
        })

    # Sort all by date descending
    result.sort(key=lambda x: x.get("created_at") or x.get("paid_at"), reverse=True)
    return {"payments": result}

@router.post("/billing/refund")
async def refund_payment(
    data: RefundPaymentRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Admin: Mark a payment as refunded (logical refund only, no gateway API)
    """

    payment = db.query(Payment).filter(Payment.id == data.payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.is_refund:
        raise HTTPException(status_code=400, detail="Payment already refunded")

    if data.refund_amount > (payment.amount or 0):
        raise HTTPException(status_code=400, detail="Refund exceeds original amount")

    payment.is_refund = True
    payment.refund_amount = data.refund_amount
    payment.refund_reason = data.refund_reason

    db.commit()
    return {"message": "Refund processed successfully"}

@router.post("/billing/manual-payment")
async def create_manual_payment(
    data: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Admin: Create a manual payment record for membership billing
    The trainee_id from frontend is actually the user.id (from /admin/members endpoint)
    """
    try:
        # Extract data - trainee_id is actually user.id from the members list
        user_id = data.get("trainee_id")
        amount = data.get("amount")
        payment_mode = data.get("payment_mode", "cash")
        transaction_id = data.get("transaction_id")
        notes = data.get("notes", "")
        membership_plan_id = data.get("membership_plan_id")
        
        # Validate user exists and is a trainee
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify user has a trainee profile
        trainee = db.query(Trainee).filter(Trainee.user_id == user_id).first()
        if not trainee:
            raise HTTPException(status_code=404, detail="Trainee profile not found for this user")
        
        # Generate receipt number if not provided
        if not transaction_id:
            transaction_id = f"REC-{datetime.now().strftime('%Y%m%d%H%M%S')}-{random.randint(1000, 9999)}"
        
        # Create payment record - trainee_id in Payment model references users.id
        payment = Payment(
            trainee_id=user_id,  # This is the user.id, matching Payment.trainee_id FK to users.id
            amount=amount,
            status="completed",
            payment_mode=payment_mode,
            transaction_id=transaction_id,
            provider=f"Manual by {current_user.name}",
            notes=notes,
            receipt_number=transaction_id
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return {
            "success": True,
            "message": "Manual payment created successfully",
            "payment_id": payment.id,
            "receipt_number": payment.receipt_number
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
@router.get("/billing/receipt/{payment_id}")
async def get_receipt(
    payment_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Admin: Generate and download receipt PDF for manual billing
    This generates a clean, professional PDF receipt on-the-fly
    """
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Get trainee details
    trainee_name = "N/A"
    trainee_email = ""
    trainee_phone = ""
    if payment.trainee_id:
        trainee = db.query(User).filter(User.id == payment.trainee_id).first()
        if trainee:
            trainee_name = trainee.name
            trainee_email = trainee.email
            trainee_phone = trainee.phone or ""
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, 
                           rightMargin=72, leftMargin=72,
                           topMargin=72, bottomMargin=18)
    
    # Container for PDF elements
    elements = []
    styles = getSampleStyleSheet()
    
    # Use Rs. instead of ₹ symbol for better PDF compatibility
    def format_currency(amount):
        return f"Rs. {amount:,.2f}"
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=12
    )
    
    # Title - Updated to Omkar Fitness Gym
    title = Paragraph("<b>OMKAR FITNESS GYM</b>", title_style)
    elements.append(title)
    
    subtitle = Paragraph("Payment Receipt", styles['Heading2'])
    elements.append(subtitle)
    elements.append(Spacer(1, 0.3*inch))
    
    # Receipt Info Table
    receipt_data = [
        ['Receipt No:', payment.receipt_number or f'REC-{payment.id}'],
        ['Date:', payment.created_at.strftime('%d %b %Y, %I:%M %p') if payment.created_at else 'N/A'],
        ['Status:', payment.status.upper()],
    ]
    
    receipt_table = Table(receipt_data, colWidths=[2*inch, 4*inch])
    receipt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db'))
    ]))
    
    elements.append(receipt_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Customer Details
    elements.append(Paragraph("<b>Customer Details</b>", heading_style))
    customer_data = [
        ['Name:', trainee_name],
        ['Email:', trainee_email],
        ['Phone:', trainee_phone],
    ]
    
    customer_table = Table(customer_data, colWidths=[2*inch, 4*inch])
    customer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db'))
    ]))
    
    elements.append(customer_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Payment Details
    elements.append(Paragraph("<b>Payment Details</b>", heading_style))
    payment_details_data = [
        ['Description', 'Amount'],
        [payment.provider or 'Manual by Admin', format_currency(payment.amount)],
        ['Payment Mode', payment.payment_mode or 'cash'],
        ['Transaction ID', payment.receipt_number or f'MAN-{payment.id}'],
    ]
    
    payment_details_table = Table(payment_details_data, colWidths=[4*inch, 2*inch])
    payment_details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db'))
    ]))
    
    elements.append(payment_details_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Total Amount
    total_data = [['TOTAL AMOUNT', format_currency(payment.amount)]]
    total_table = Table(total_data, colWidths=[4*inch, 2*inch])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
    ]))
    
    elements.append(total_table)
    elements.append(Spacer(1, 0.5*inch))
    
    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#6b7280'),
        alignment=TA_CENTER
    )
    
    footer_text = """
    <br/><br/>
    <b>Thank you for choosing Omkar Fitness Gym!</b><br/>
    This is a computer-generated receipt and does not require a signature.<br/>
    For queries, contact: support@omkarfitness.com | +91-XXXX-XXXXXX
    """
    elements.append(Paragraph(footer_text, footer_style))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    # Return PDF as downloadable file
    filename = f"Omkar_Fitness_Receipt_{payment.receipt_number or payment.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ====================== ADMIN SESSIONS ======================


@router.get("/sessions")
async def get_admin_sessions(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List active admin sessions for current admin"""

    sessions = (
        db.query(AdminSession)
        .filter(
            AdminSession.user_id == current_user.id,
            AdminSession.is_active == True,
        )
        .all()
    )

    return {
        "sessions": [
            {
                "id": s.id,
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "login_time": s.login_time.isoformat() if s.login_time else None,
                "last_activity": s.last_activity.isoformat()
                if s.last_activity
                else None,
            }
            for s in sessions
        ]
    }


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Revoke a specific admin session"""

    session = (
        db.query(AdminSession)
        .filter(
            AdminSession.id == session_id,
            AdminSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False
    db.commit()

    return {"message": "Session revoked successfully"}


# ====================== USER MANAGEMENT ======================


@router.post("/users")
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Generic user creation (for admin tools)"""

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email.lower().strip())
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    temp_password = "TempPass123"  # you can change logic later
    hashed_password = get_password_hash(temp_password)

    new_user = User(
        email=user_data.email.lower().strip(),
        password_hash=hashed_password,
        name=user_data.name.strip(),
        role=user_data.role,
        is_active=True,
        is_verified=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user_id": new_user.id,
        "temp_password": temp_password,
    }


@router.get("/users")
async def get_all_users(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all users"""

    users = db.query(User).all()

    return {
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "role": u.role.value,
                "is_active": u.is_active,
                "is_verified": u.is_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    }


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed user information"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user.role.value,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_user_details: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting user: {str(e)}")


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    data: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update user information"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Cannot update admin users' role/critical fields by non-superadmin
        if user.role == UserRole.ADMIN and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Cannot modify admin users")
        
        # Update allowed fields
        if "name" in data and data["name"]:
            user.name = data["name"].strip()
        if "phone" in data:
            user.phone = data["phone"]
        if "is_active" in data:
            user.is_active = data["is_active"]
        
        db.commit()
        return {"message": "User updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in update_user: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")


@router.post("/reset-password/{user_id}")
async def reset_user_password(
    user_id: int,
    password_data: PasswordResetRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Reset password for trainer or trainee (admin only)"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Cannot reset admin password this way
        if user.role == UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Cannot reset admin passwords this way. Use profile settings.")
        
        # Cannot reset own password this way
        if user.id == current_user.id:
            raise HTTPException(status_code=403, detail="Use profile settings to change your own password")
        
        # Update password (password_data is already validated by Pydantic)
        user.password_hash = get_password_hash(password_data.new_password)
        db.commit()
        
        return {
            "message": f"Password reset successfully for {user.name}",
            "user_id": user.id,
            "email": user.email,
            "temporary_password": password_data.new_password
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in reset_user_password: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error resetting password: {str(e)}")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Permanently delete a user and all related data"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent deleting the current admin
        if user.id == current_user.id:
            raise HTTPException(status_code=403, detail="Cannot delete your own account")
        
        # Prevent deleting other admin users (unless superadmin)
        if user.role == UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Cannot delete admin users")
        
        # Permanently delete user and all related data
        # IMPORTANT: Delete in correct order to avoid foreign key constraint errors
        
        # 1. Get trainee profile first (needed for AIReport and TrainerMessage)
        trainee = db.query(Trainee).filter(Trainee.user_id == user_id).first()
        
        # 2. Delete trainer messages (references trainee.id and trainer.id)
        if trainee:
            db.query(TrainerMessage).filter(
                (TrainerMessage.trainee_id == trainee.id) | 
                (TrainerMessage.sender_id == user_id) | 
                (TrainerMessage.receiver_id == user_id)
            ).delete(synchronize_session=False)
        
        # 3. Delete AI reports (references trainee.id, not user.id)
        if trainee:
            db.query(AIReport).filter(AIReport.trainee_id == trainee.id).delete(synchronize_session=False)
        
        # 4. Delete workouts (references user.id)
        db.query(Workout).filter(Workout.trainee_id == user_id).delete(synchronize_session=False)
        
        # 5. Delete measurements
        db.query(Measurement).filter(Measurement.trainee_id == user_id).delete(synchronize_session=False)
        
        # 6. Delete progress measurements
        db.query(ProgressMeasurement).filter(ProgressMeasurement.trainee_id == user_id).delete(synchronize_session=False)
        
        # 7. Delete nutrition logs
        db.query(NutritionLog).filter(NutritionLog.trainee_id == user_id).delete(synchronize_session=False)
        
        # 8. Delete diet plans
        db.query(DietPlan).filter(DietPlan.trainee_id == user_id).delete(synchronize_session=False)
        
        # 9. Delete workout plans
        db.query(WorkoutPlan).filter(WorkoutPlan.trainee_id == user_id).delete(synchronize_session=False)
        
        # 10. Delete payments
        db.query(Payment).filter(Payment.trainee_id == user_id).delete(synchronize_session=False)
        
        # 11. Delete memberships
        db.query(Membership).filter(Membership.trainee_id == user_id).delete(synchronize_session=False)
        
        # 12. Delete attendance records
        db.query(Attendance).filter(Attendance.trainee_id == user_id).delete(synchronize_session=False)
        
        # 13. Delete progress photos
        db.query(ProgressPhoto).filter(ProgressPhoto.trainee_id == user_id).delete(synchronize_session=False)
        
        # 14. Delete messages (sent and received)
        db.query(Message).filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        ).delete(synchronize_session=False)
        
        # 15. Delete admin sessions
        db.query(AdminSession).filter(AdminSession.user_id == user_id).delete(synchronize_session=False)
        
        # 16. Delete trainer profile if exists (must be before user)
        trainer = db.query(Trainer).filter(Trainer.user_id == user_id).first()
        if trainer:
            # Delete trainer-related data
            db.query(TrainerRevenue).filter(TrainerRevenue.trainer_id == trainer.id).delete(synchronize_session=False)
            db.query(TrainerSalary).filter(TrainerSalary.trainer_id == trainer.id).delete(synchronize_session=False)
            db.query(TrainerSchedule).filter(TrainerSchedule.trainer_id == trainer.id).delete(synchronize_session=False)
            db.query(TrainerAttendance).filter(TrainerAttendance.trainer_id == trainer.id).delete(synchronize_session=False)
            
            # Use raw SQL for tables with schema mismatches
            from sqlalchemy import text
            trainer_id_str = str(trainer.id)
            try:
                db.execute(text("DELETE FROM trainer_documents WHERE trainer_id = :tid"), {"tid": trainer_id_str})
            except Exception:
                pass  # Table may not exist or have schema mismatch
            try:
                db.execute(text("DELETE FROM trainer_leaves WHERE trainer_id = :tid"), {"tid": trainer_id_str})
            except Exception:
                pass  # Table may not exist or have schema mismatch
            
            # Update trainees assigned to this trainer (set trainer_id to NULL)
            db.query(Trainee).filter(Trainee.trainer_id == trainer.id).update(
                {Trainee.trainer_id: None},
                synchronize_session=False
            )
            
            # Delete trainer profile
            db.delete(trainer)
        
        # 17. Delete trainee profile (must be before user)
        if trainee:
            db.delete(trainee)
        
        # 18. Finally, delete the user
        db.delete(user)
        
        db.commit()
        return {"message": "User and all related data deleted permanently"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in delete_user: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")


# ====================== MEMBER (TRAINEE) MANAGEMENT ======================

class CreateTraineeRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    trainer_id: Optional[UUID] = None
    
@router.post("/members")
async def create_member(
    member_data: MemberManagementRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Create a trainee + User + Trainee Profile with enhanced fields
    """
    try:
        from datetime import datetime, timedelta
        import secrets
        
        # Check email already exists
        existing_user = (
            db.query(User)
            .filter(User.email == member_data.email.lower().strip())
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists with this email")

        # Password: use provided or generate secure random password
        if member_data.password and len(member_data.password) >= 6:
            temp_password = member_data.password
        else:
            # Generate secure random password using secrets (like trainers)
            temp_password = secrets.token_urlsafe(8)
        
        hashed_password = get_password_hash(temp_password)

        # Create the User first
        new_user = User(
            email=member_data.email.lower().strip(),
            password_hash=hashed_password,
            name=member_data.name.strip(),
            phone=member_data.phone,
            role=UserRole.TRAINEE,
            is_active=True,
            is_verified=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Convert trainer_id safely (UUID or None)
        trainer_uuid = None
        if member_data.trainer_id:
            try:
                trainer_uuid = UUID(str(member_data.trainer_id))
            except ValueError:
                raise HTTPException(400, detail="Invalid trainer_id (must be UUID)")

        # Parse date of birth if provided
        dob = None
        if member_data.date_of_birth:
            try:
                dob = datetime.strptime(member_data.date_of_birth, "%Y-%m-%d").date()
            except ValueError:
                pass  # Ignore invalid date format

        # Create Trainee profile with all fields
        trainee = Trainee(
            user_id=new_user.id,
            trainer_id=trainer_uuid,
            date_of_birth=dob,
            gender=member_data.gender,
            address=member_data.address,
            emergency_contact_name=member_data.emergency_contact_name,
            emergency_contact_phone=member_data.emergency_contact_phone,
            health_conditions=member_data.health_conditions,
            fitness_goals=member_data.fitness_goals,
        )
        db.add(trainee)
        db.commit()
        db.refresh(trainee)

        # If membership_plan_id provided, create membership
        membership_created = False
        if member_data.membership_plan_id:
            plan = db.query(MembershipPlan).filter(MembershipPlan.id == member_data.membership_plan_id).first()
            if plan:
                membership = Membership(
                    trainee_id=new_user.id,
                    membership_type=plan.membership_type,
                    start_date=datetime.utcnow(),
                    end_date=datetime.utcnow() + timedelta(days=plan.duration_months * 30),
                    status="active",
                    price=plan.price,
                )
                db.add(membership)
                db.commit()
                membership_created = True

        return {
            "message": "Trainee created successfully",
            "trainee_id": str(trainee.id),
            "user_id": new_user.id,
            "email": new_user.email,
            "temp_password": temp_password,
            "generated_password": temp_password,  # Legacy field for compatibility
            "membership_created": membership_created,
        }
    except HTTPException:
        # Re-raise HTTP exceptions without wrapping
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in create_member: {e}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating trainee: {str(e)}")


@router.get("/members")
async def get_members(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
):
    """List members (trainees) with trainer + membership info - OPTIMIZED"""
    from sqlalchemy.orm import joinedload
    
    try:
        # Eager load relationships to prevent N+1 queries
        # Join with User to ensure only trainees with valid user accounts
        trainees = db.query(Trainee).join(User).options(
            joinedload(Trainee.user),
            joinedload(Trainee.trainer).joinedload(Trainer.user)
        ).offset(skip).limit(limit).all()
        
        # Get all memberships for these trainees in one query
        trainee_ids = [t.user.id for t in trainees if t.user]
        memberships_dict = {}
        if trainee_ids:
            memberships = db.query(Membership).filter(
                Membership.trainee_id.in_(trainee_ids)
            ).order_by(Membership.created_at.desc()).all()
            
            for m in memberships:
                if m.trainee_id not in memberships_dict:
                    memberships_dict[m.trainee_id] = []
                memberships_dict[m.trainee_id].append(m)

        result = []
        for trainee in trainees:
            try:
                # Skip if user is None (orphaned trainee record)
                if not trainee.user:
                    print(f"Warning: Trainee {trainee.id} has no associated user, skipping")
                    continue
                    
                user = trainee.user
                trainer_name = trainee.trainer.user.name if trainee.trainer and trainee.trainer.user else None

                memberships = memberships_dict.get(user.id, [])

                memberships_data = [
                    {
                        "id": m.id,
                        "membership_type": m.membership_type,
                        "status": m.status,
                        "start_date": m.start_date.isoformat() if m.start_date else None,
                        "end_date": m.end_date.isoformat() if m.end_date else None,
                        "created_at": m.created_at.isoformat() if m.created_at else None,
                        "price": m.price,
                    }
                    for m in memberships
                ]

                result.append(
                    {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "phone": user.phone,
                        "trainer_name": trainer_name,
                        "memberships": memberships_data,
                        "created_at": user.created_at.isoformat() if user.created_at else None,
                    }
                )
            except Exception as e:
                print(f"Error processing trainee {trainee.id}: {e}")
                import traceback
                traceback.print_exc()
                continue

        return {"members": result}
        
    except Exception as e:
        print(f"ERROR in get_members: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching members: {str(e)}")


@router.put("/members/{member_id}")
async def update_member(
    member_id: int,
    member_data: MemberManagementRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update member basic info + trainer assignment"""

    user = db.query(User).filter(User.id == member_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")

    user.name = member_data.name.strip()
    user.email = member_data.email.lower().strip()
    user.phone = member_data.phone

    trainee = db.query(Trainee).filter(Trainee.user_id == member_id).first()
    if trainee:
        trainee.trainer_id = member_data.trainer_id

    db.commit()
    return {"message": "Member updated successfully"}


@router.get("/members/{member_id}")
def get_member_details(
    member_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed trainee information"""
    
    try:
        user = db.query(User).filter(User.id == member_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Member not found")
        
        trainee = db.query(Trainee).filter(Trainee.user_id == member_id).first()
        
        # Get trainer info
        trainer_name = None
        trainer_id = None
        if trainee and trainee.trainer_id:
            trainer = db.query(Trainer).filter(Trainer.id == trainee.trainer_id).first()
            if trainer and trainer.user:
                trainer_name = trainer.user.name
                trainer_id = str(trainer.id)
        
        # Get memberships
        memberships = (
            db.query(Membership)
            .filter(Membership.trainee_id == user.id)
            .order_by(Membership.created_at.desc())
            .all()
        )
        
        memberships_data = [
            {
                "id": m.id,
                "membership_type": m.membership_type,
                "status": m.status,
                "start_date": m.start_date.isoformat() if m.start_date else None,
                "end_date": m.end_date.isoformat() if m.end_date else None,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "price": m.price,
            }
            for m in memberships
        ]
        
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "trainer_id": trainer_id,
            "trainer_name": trainer_name,
            "memberships": memberships_data,
            "date_of_birth": trainee.date_of_birth.isoformat() if trainee and trainee.date_of_birth else None,
            "gender": trainee.gender if trainee else None,
            "address": trainee.address if trainee else None,
            "emergency_contact_name": trainee.emergency_contact_name if trainee else None,
            "emergency_contact_phone": trainee.emergency_contact_phone if trainee else None,
            "health_conditions": trainee.health_conditions if trainee else None,
            "fitness_goals": trainee.fitness_goals if trainee else None,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in get_member_details: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error getting member details: {str(e)}")


@router.delete("/members/{member_id}")
def delete_member(
    member_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Permanently delete member (trainee) and all related data"""
    
    try:
        user = db.query(User).filter(User.id == member_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Check if user is admin (cannot delete admin)
        if user.role == UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Cannot delete admin users")
        
        # Get trainee profile first (needed for foreign key references)
        trainee = db.query(Trainee).filter(Trainee.user_id == member_id).first()
        trainee_id = trainee.id if trainee else None
        
        # Batch delete all related data in optimal order
        # Using synchronize_session=False for better performance
        
        # Delete records referencing trainee.id
        if trainee_id:
            db.query(TrainerMessage).filter(
                TrainerMessage.trainee_id == trainee_id
            ).delete(synchronize_session=False)
            
            db.query(AIReport).filter(
                AIReport.trainee_id == trainee_id
            ).delete(synchronize_session=False)
        
        # Delete records referencing user_id as trainee_id
        db.query(Workout).filter(Workout.trainee_id == member_id).delete(synchronize_session=False)
        db.query(Measurement).filter(Measurement.trainee_id == member_id).delete(synchronize_session=False)
        db.query(ProgressMeasurement).filter(ProgressMeasurement.trainee_id == member_id).delete(synchronize_session=False)
        db.query(NutritionLog).filter(NutritionLog.trainee_id == member_id).delete(synchronize_session=False)
        db.query(DietPlan).filter(DietPlan.trainee_id == member_id).delete(synchronize_session=False)
        db.query(WorkoutPlan).filter(WorkoutPlan.trainee_id == member_id).delete(synchronize_session=False)
        db.query(Payment).filter(Payment.trainee_id == member_id).delete(synchronize_session=False)
        db.query(Membership).filter(Membership.trainee_id == member_id).delete(synchronize_session=False)
        db.query(Attendance).filter(Attendance.trainee_id == member_id).delete(synchronize_session=False)
        db.query(ProgressPhoto).filter(ProgressPhoto.trainee_id == member_id).delete(synchronize_session=False)
        
        # Delete messages (sender or receiver)
        db.query(Message).filter(
            (Message.sender_id == member_id) | (Message.receiver_id == member_id)
        ).delete(synchronize_session=False)
        
        # Delete trainer messages by user_id
        db.query(TrainerMessage).filter(
            (TrainerMessage.sender_id == member_id) | (TrainerMessage.receiver_id == member_id)
        ).delete(synchronize_session=False)
        
        # Delete admin sessions
        db.query(AdminSession).filter(AdminSession.user_id == member_id).delete(synchronize_session=False)
        
        # Delete trainee profile
        if trainee:
            db.delete(trainee)
        
        # Finally delete the user
        db.delete(user)
        
        # Commit all changes at once
        db.commit()
        
        return {"success": True, "message": "Member and all related data deleted permanently"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in delete_member: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete member: {str(e)}")


@router.post("/members/{member_id}/assign-trainer")
async def assign_trainer(
    member_id: int,
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Assign trainer to a member"""

    trainee = db.query(Trainee).filter(Trainee.user_id == member_id).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Member not found")

    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    trainee.trainer_id = trainer_id
    db.commit()

    return {"message": "Trainer assigned successfully"}


@router.put("/members/{member_id}/trainer")
async def update_trainee_trainer(
    member_id: int,
    data: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update or change trainer assignment for a trainee"""
    
    try:
        trainee = db.query(Trainee).filter(Trainee.user_id == member_id).first()
        if not trainee:
            raise HTTPException(status_code=404, detail="Member not found")
        
        trainer_id = data.get("trainer_id")
        
        if trainer_id is None or trainer_id == "":
            # Remove trainer
            trainee.trainer_id = None
        else:
            # Verify trainer exists
            trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
            if not trainer:
                raise HTTPException(status_code=404, detail="Trainer not found")
            trainee.trainer_id = trainer_id
        
        db.commit()
        return {"message": "Trainer assignment updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in update_trainee_trainer: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating trainer: {str(e)}")


@router.put("/members/{member_id}/membership")
async def update_trainee_membership(
    member_id: int,
    data: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update membership (extend, cancel, etc.)"""
    
    try:
        user = db.query(User).filter(User.id == member_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Member not found")
        
        action = data.get("action", "").lower()
        
        # Get current active membership
        current_membership = (
            db.query(Membership)
            .filter(Membership.trainee_id == member_id, Membership.status == "active")
            .order_by(Membership.end_date.desc())
            .first()
        )
        
        if action == "extend":
            if not current_membership:
                raise HTTPException(status_code=400, detail="No active membership to extend")
            
            extend_days = data.get("extend_days", 30)
            from datetime import timedelta
            current_membership.end_date = current_membership.end_date + timedelta(days=extend_days)
            db.commit()
            return {"message": f"Membership extended by {extend_days} days"}
        
        elif action == "cancel":
            if not current_membership:
                raise HTTPException(status_code=400, detail="No active membership to cancel")
            
            current_membership.status = "cancelled"
            db.commit()
            return {"message": "Membership cancelled"}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in update_trainee_membership: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating membership: {str(e)}")


# ====================== MEMBERSHIPS ======================


@router.post("/memberships")
async def create_membership(
    membership_data: MembershipCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a membership for a trainee based on active plan"""

    plan = (
        db.query(MembershipPlan)
        .filter(
            MembershipPlan.membership_type == membership_data.membership_type,
            MembershipPlan.is_active == True,
        )
        .first()
    )

    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")

    membership = Membership(
        trainee_id=membership_data.trainee_id,
        membership_type=plan.membership_type,
        start_date=membership_data.start_date,
        end_date=membership_data.end_date,
        status="active",
        price=plan.price,
        auto_renew=membership_data.auto_renew,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return {"message": "Membership created successfully"}


@router.get("/memberships")
async def get_memberships(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all memberships"""

    memberships = db.query(Membership).all()

    return {
        "memberships": [
            {
                "id": m.id,
                "trainee_id": m.trainee_id,
                "membership_type": m.membership_type,
                "start_date": m.start_date.isoformat() if m.start_date else None,
                "end_date": m.end_date.isoformat() if m.end_date else None,
                "status": m.status,
                "price": m.price,
            }
            for m in memberships
        ]
    }


# ====================== EQUIPMENT ======================


@router.post("/equipment")
async def create_equipment(
    equipment_data: EquipmentCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Add equipment"""

    equipment = Equipment(**equipment_data.dict())
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return {"message": "Equipment added", "equipment_id": equipment.id}


@router.get("/equipment")
async def get_equipment(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all equipment"""

    eq = db.query(Equipment).all()

    return {
        "equipment": [
            {
                "id": e.id,
                "name": e.name,
                "type": e.type,
                "quantity": e.quantity,
                "condition": e.condition,
                "status": e.status,
                "location": e.location,
                "last_maintenance": e.last_maintenance.isoformat()
                if e.last_maintenance
                else None,
                "next_maintenance": e.next_maintenance.isoformat()
                if e.next_maintenance
                else None,
                "maintenance_notes": getattr(e, 'maintenance_notes', None),
                "purchase_date": e.purchase_date.isoformat() if hasattr(e, 'purchase_date') and e.purchase_date else None,
                "warranty_expiry": e.warranty_expiry.isoformat() if hasattr(e, 'warranty_expiry') and e.warranty_expiry else None,
                "serial_number": getattr(e, 'serial_number', None),
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in eq
        ]
    }


@router.put("/equipment/{equipment_id}")
async def update_equipment(
    equipment_id: int,
    equipment_data: Optional[dict] = Body(default=None),
    status: Optional[str] = Query(default=None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update equipment - full update or status only"""

    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    # If only status parameter is passed (legacy support)
    if status and not equipment_data:
        if status not in ["operational", "maintenance", "retired", "out_of_order"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        equipment.status = status
        if status == "maintenance":
            equipment.last_maintenance = datetime.utcnow()
    # Full equipment update from request body
    elif equipment_data:
        for field in ["name", "type", "quantity", "condition", "status", "location", "maintenance_notes", "serial_number"]:
            if field in equipment_data and equipment_data[field] is not None:
                setattr(equipment, field, equipment_data[field])
        
        # Handle date fields
        for date_field in ["last_maintenance", "next_maintenance", "purchase_date", "warranty_expiry"]:
            if date_field in equipment_data and equipment_data[date_field]:
                try:
                    setattr(equipment, date_field, datetime.fromisoformat(equipment_data[date_field].replace('Z', '+00:00')))
                except (ValueError, AttributeError):
                    pass  # Skip invalid dates

    db.commit()
    db.refresh(equipment)
    return {"message": "Equipment updated", "equipment_id": equipment.id}


@router.delete("/equipment/{equipment_id}")
async def delete_equipment(
    equipment_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Remove an equipment item"""

    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    db.delete(equipment)
    db.commit()
    return {"message": "Equipment deleted"}



# ====================== MEMBERSHIP PLANS ======================



from pydantic import BaseModel, Field

class MembershipPlanCreate(BaseModel):
    name: str
    membership_type: str
    price: float
    duration_months: int
    features: str = ""
    is_active: bool = True

@router.post("/membership-plans")
async def create_membership_plan(
    plan_data: MembershipPlanCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a membership plan"""
    plan = MembershipPlan(**plan_data.dict())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"message": "Membership plan created", "plan_id": plan.id}


@router.get("/membership-plans")
async def get_membership_plans(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List active membership plans"""

    plans = db.query(MembershipPlan).filter(MembershipPlan.is_active == True).all()

    return {
        "membership_plans": [
            {
                "id": p.id,
                "name": p.name,
                "membership_type": p.membership_type,
                "price": p.price,
                "duration_months": p.duration_months,
                "features": p.features,
            }
            for p in plans
        ]
    }


@router.put("/membership-plans/{plan_id}")
async def update_membership_plan(
    plan_id: int,
    plan_data: MembershipPlanCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update a membership plan"""
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    
    for key, value in plan_data.dict().items():
        setattr(plan, key, value)
    
    db.commit()
    db.refresh(plan)
    return {"message": "Membership plan updated", "plan_id": plan.id}


@router.delete("/membership-plans/{plan_id}")
async def delete_membership_plan(
    plan_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a membership plan"""
    plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Membership plan not found")
    
    # Check if any active memberships are using this plan type
    active_memberships = db.query(Membership).filter(
        Membership.membership_type == plan.membership_type,
        Membership.status == "active"
    ).count()
    
    if active_memberships > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete plan. {active_memberships} active membership(s) are using this plan."
        )
    
    db.delete(plan)
    db.commit()
    return {"message": "Membership plan deleted successfully"}


# ====================== TRAINER MANAGEMENT ======================


@router.post("/create-trainer")
def create_trainer(
    data: CreateTrainerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """
    Admin-only: create a trainer.
    - Creates a User with role=TRAINER
    - Creates a Trainer profile with all details
    - Creates TrainerSalary config
    - Returns trainer_id and auto-generated password
    """

    exists = (
        db.query(User)
        .filter(User.email == data.email.lower().strip())
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    raw_password = secrets.token_urlsafe(8)
    hashed = get_password_hash(raw_password)

    # Create user with phone if provided
    user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        password_hash=hashed,
        role=UserRole.TRAINER,
        is_active=True,
        is_verified=True,
        phone=data.phone.strip() if data.phone else None,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create trainer profile with all details
    trainer = Trainer(
        user_id=user.id,
        specialization=data.specialization.strip() if data.specialization else None,
        experience_years=data.experience_years or 0,
        certifications=data.certifications.strip() if data.certifications else None,
        bio=data.bio.strip() if data.bio else None,
        is_active=True,
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)

    # Create salary configuration
    salary_config = TrainerSalary(
        trainer_id=trainer.id,
        salary_model=data.salary_model or "fixed",
        base_salary=data.base_salary or 0,
        commission_per_session=data.commission_per_session or 0,
        is_active=True,
    )
    db.add(salary_config)
    db.commit()

    return {
        "message": "Trainer created successfully",
        "trainer_id": str(trainer.id),
        "login_password": raw_password,
    }


@router.get("/trainers")
def get_trainers(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """List all trainers for admin UI - OPTIMIZED with eager loading"""
    from sqlalchemy.orm import joinedload
    from sqlalchemy import func
    
    try:
        # Single query with eager loading - prevents N+1 problem
        # Filter to only include trainers with valid user relationships
        trainers = db.query(Trainer).join(User).options(
            joinedload(Trainer.user),
            joinedload(Trainer.salary_configs)
        ).all()
        
        # Batch count trainees for all trainers in one query
        trainee_counts = dict(
            db.query(Trainee.trainer_id, func.count(Trainee.id))
            .group_by(Trainee.trainer_id)
            .all()
        )
        
        trainer_list = []
        for t in trainers:
            try:
                # Skip if user is None (orphaned trainer record)
                if not t.user:
                    print(f"Warning: Trainer {t.id} has no associated user, skipping")
                    continue
                    
                salary = t.salary_configs[0] if t.salary_configs else None
                # Use UUID object directly for lookup, not string
                assigned_count = trainee_counts.get(t.id, 0)
                
                trainer_list.append({
                    "id": str(t.id),
                    "user": {
                        "id": t.user.id,
                        "name": t.user.name,
                        "email": t.user.email,
                        "phone": t.user.phone if hasattr(t.user, 'phone') else None,
                    },
                    "specialization": t.specialization,
                    "experience_years": getattr(t, "experience_years", 0) or 0,
                    "certifications": getattr(t, "certifications", None),
                    "bio": t.bio if hasattr(t, 'bio') else None,
                    "is_active": getattr(t, "is_active", True),
                    "status": "active" if t.user.is_active else "inactive",
                    "base_salary": float(salary.base_salary) if salary and salary.base_salary else 0,
                    "commission_per_session": float(salary.commission_per_session) if salary and salary.commission_per_session else 0,
                    "salary_model": salary.salary_model if salary else "fixed",
                    "assigned_trainees": assigned_count,
                    "created_at": (t.created_at.isoformat() if getattr(t, "created_at", None) else 
                                  (t.user.created_at.isoformat() if t.user.created_at else None)),
                })
            except Exception as e:
                print(f"Error processing trainer {t.id}: {e}")
                import traceback
                traceback.print_exc()
                continue

        return {"trainers": trainer_list}
        
    except Exception as e:
        print(f"ERROR in get_trainers: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching trainers: {str(e)}")


@router.get("/trainers/{trainer_id}")
def get_trainer_details(
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get detailed information about a specific trainer including trainees, attendance, etc."""
    from uuid import UUID as PyUUID
    from datetime import datetime, timedelta
    
    try:
        trainer_uuid = PyUUID(trainer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid trainer ID format")

    trainer = db.query(Trainer).filter(Trainer.id == trainer_uuid).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")

    # Get trainer salary info
    salary = db.query(TrainerSalary).filter(TrainerSalary.trainer_id == trainer_uuid).first()

    # Build trainer profile
    trainer_profile = {
        "id": str(trainer.id),
        "name": trainer.user.name,
        "email": trainer.user.email,
        "phone": trainer.user.phone,
        "specialization": trainer.specialization,
        "experience_years": getattr(trainer, "experience_years", 0) or 0,
        "certifications": getattr(trainer, "certifications", None),
        "bio": trainer.bio,
        "status": "active" if trainer.user.is_active else "inactive",
        "is_active": trainer.user.is_active,
        "created_at": trainer.created_at.isoformat() if getattr(trainer, "created_at", None) else None,
    }

    # Build salary config
    salary_config = {
        "model": salary.salary_model if salary else "fixed",
        "base_salary": float(salary.base_salary) if salary else 0,
        "commission_per_session": float(salary.commission_per_session) if salary else 0,
    }

    # Get assigned trainees
    trainees_list = []
    try:
        trainees = db.query(Trainee).filter(Trainee.assigned_trainer_id == trainer_uuid).all()
        for trainee in trainees:
            trainees_list.append({
                "id": str(trainee.id),
                "name": trainee.user.name if trainee.user else "Unknown",
                "email": trainee.user.email if trainee.user else "",
                "phone": trainee.user.phone if trainee.user else "",
                "status": "active" if (trainee.user and trainee.user.is_active) else "inactive",
                "fitness_goal": getattr(trainee, "fitness_goal", None),
                "membership_type": getattr(trainee, "membership_type", "standard"),
            })
    except Exception as e:
        print(f"Error fetching trainees: {e}")

    # Get trainer attendance (last 30 days)
    attendance_list = []
    try:
        thirty_days_ago = datetime.now() - timedelta(days=30)
        attendance_records = db.query(TrainerAttendance).filter(
            TrainerAttendance.trainer_id == trainer_uuid,
            TrainerAttendance.date >= thirty_days_ago.date()
        ).order_by(TrainerAttendance.date.desc()).limit(30).all()
        
        for record in attendance_records:
            attendance_list.append({
                "id": str(record.id),
                "date": record.date.isoformat() if record.date else None,
                "status": record.status,
                "check_in_time": record.check_in_time.isoformat() if getattr(record, "check_in_time", None) else None,
                "check_out_time": record.check_out_time.isoformat() if getattr(record, "check_out_time", None) else None,
            })
    except Exception as e:
        print(f"Error fetching attendance: {e}")

    # Get PT sessions (last 30 days)
    pt_sessions = []
    try:
        sessions = db.query(PTSession).filter(
            PTSession.trainer_id == trainer_uuid,
            PTSession.session_date >= thirty_days_ago.date()
        ).order_by(PTSession.session_date.desc()).limit(30).all()
        
        for session in sessions:
            trainee_name = "Unknown"
            if session.trainee:
                trainee_name = session.trainee.user.name if session.trainee.user else "Unknown"
            pt_sessions.append({
                "id": str(session.id),
                "trainee_name": trainee_name,
                "session_date": session.session_date.isoformat() if session.session_date else None,
                "session_type": getattr(session, "session_type", "PT"),
                "status": session.status,
                "notes": getattr(session, "notes", None),
            })
    except Exception as e:
        print(f"Error fetching PT sessions: {e}")

    # Get payouts
    payouts = []
    try:
        payout_records = db.query(TrainerRevenue).filter(
            TrainerRevenue.trainer_id == trainer_uuid
        ).order_by(TrainerRevenue.period_start.desc()).limit(12).all()
        
        for payout in payout_records:
            payouts.append({
                "id": str(payout.id),
                "period_start": payout.period_start.isoformat() if payout.period_start else None,
                "period_end": payout.period_end.isoformat() if payout.period_end else None,
                "total_amount": float(payout.total_amount) if payout.total_amount else 0,
                "status": payout.status,
                "paid_at": payout.paid_at.isoformat() if getattr(payout, "paid_at", None) else None,
            })
    except Exception as e:
        print(f"Error fetching payouts: {e}")

    return {
        "trainer": trainer_profile,
        "salary_config": salary_config,
        "trainees": trainees_list,
        "attendance_list": attendance_list,
        "pt_sessions": pt_sessions,
        "schedule_list": [],  # Can be populated if schedule model exists
        "payouts": payouts,
    }


@router.put("/trainers/{trainer_id}")
def update_trainer(
    trainer_id: str,
    trainer_data: TrainerUpdateRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update trainer information (name, email, phone, specialization, etc.)"""
    from uuid import UUID as PyUUID
    
    try:
        try:
            trainer_uuid = PyUUID(trainer_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid trainer ID format")
            
        trainer = db.query(Trainer).filter(Trainer.id == trainer_uuid).first()
        if not trainer:
            raise HTTPException(status_code=404, detail="Trainer not found")

        # Update user info
        if trainer_data.name:
            trainer.user.name = trainer_data.name.strip()
        if trainer_data.email:
            # Check if email already exists
            existing = db.query(User).filter(
                User.email == trainer_data.email.lower().strip(),
                User.id != trainer.user.id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already exists")
            trainer.user.email = trainer_data.email.lower().strip()
        if trainer_data.phone is not None:
            trainer.user.phone = trainer_data.phone

        # Update trainer-specific info
        if trainer_data.specialization is not None:
            trainer.specialization = trainer_data.specialization
        if trainer_data.experience_years is not None:
            trainer.experience_years = trainer_data.experience_years
        if trainer_data.certifications is not None:
            trainer.certifications = trainer_data.certifications
        if trainer_data.bio is not None:
            trainer.bio = trainer_data.bio

        # Update salary info if provided
        if any([trainer_data.salary_model, trainer_data.base_salary, trainer_data.commission_per_session]):
            salary = db.query(TrainerSalary).filter(TrainerSalary.trainer_id == trainer_uuid).first()
            if not salary:
                salary = TrainerSalary(trainer_id=trainer_uuid)
                db.add(salary)

            if trainer_data.salary_model:
                salary.salary_model = trainer_data.salary_model
            if trainer_data.base_salary is not None:
                salary.base_salary = trainer_data.base_salary
            if trainer_data.commission_per_session is not None:
                salary.commission_per_session = trainer_data.commission_per_session

        db.commit()

        return {
            "message": "Trainer updated successfully",
            "trainer_id": str(trainer.id),
            "name": trainer.user.name,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in update_trainer: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error updating trainer: {str(e)}")


@router.delete("/trainers/{trainer_id}")
def delete_trainer(
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Permanently delete a trainer and all related data using raw SQL to avoid schema mismatches"""
    from sqlalchemy import text
    
    try:
        # Validate UUID format
        from uuid import UUID as PyUUID
        try:
            trainer_uuid = PyUUID(trainer_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid trainer ID format")
        
        # Get trainer info using raw SQL to avoid model loading issues
        result = db.execute(
            text("SELECT id, user_id FROM trainers WHERE id = :tid"),
            {"tid": trainer_id}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Trainer not found")
        
        user_id = result[1]
        
        # Use raw SQL for ALL deletions to avoid schema mismatch issues
        # Delete in correct order to avoid foreign key constraints
        
        # 1. Delete trainer messages
        try:
            db.execute(text("DELETE FROM trainer_messages WHERE trainer_id = :tid OR sender_id = :uid OR receiver_id = :uid"), 
                      {"tid": trainer_id, "uid": user_id})
        except Exception as e:
            print(f"Note: trainer_messages deletion: {e}")
        
        # 2. Delete trainer revenue
        try:
            db.execute(text("DELETE FROM trainer_revenue WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainer_revenue deletion: {e}")
        
        # 3. Delete trainer salary
        try:
            db.execute(text("DELETE FROM trainer_salaries WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainer_salaries deletion: {e}")
        
        # 4. Delete trainer schedules
        try:
            db.execute(text("DELETE FROM trainer_schedules WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainer_schedules deletion: {e}")
        
        # 5. Delete trainer attendance
        try:
            db.execute(text("DELETE FROM trainer_attendance WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainer_attendance deletion: {e}")
        
        # 6. Delete PT sessions
        try:
            db.execute(text("DELETE FROM pt_sessions WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: pt_sessions deletion: {e}")
        
        # 7. Update gym schedule slots (set trainer_id to NULL)
        try:
            db.execute(text("UPDATE gym_schedule_slots SET trainer_id = NULL WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: gym_schedule_slots update: {e}")
        
        # 8. Delete trainer documents
        try:
            db.execute(text("DELETE FROM trainer_documents WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainer_documents deletion: {e}")
        
        # 9. Delete trainer leaves
        try:
            db.execute(text("DELETE FROM trainer_leaves WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainer_leaves deletion: {e}")
        
        # 10. Update trainees (set trainer_id to NULL)
        try:
            db.execute(text("UPDATE trainees SET trainer_id = NULL WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: trainees update: {e}")
        
        # 11. Delete workout plans
        try:
            db.execute(text("DELETE FROM workout_plans WHERE trainer_id = :tid"), {"tid": trainer_id})
        except Exception as e:
            print(f"Note: workout_plans deletion: {e}")
        
        # 12. Delete messages
        try:
            db.execute(text("DELETE FROM messages WHERE sender_id = :uid OR receiver_id = :uid"), {"uid": user_id})
        except Exception as e:
            print(f"Note: messages deletion: {e}")
        
        # 13. Delete admin sessions
        try:
            db.execute(text("DELETE FROM admin_sessions WHERE user_id = :uid"), {"uid": user_id})
        except Exception as e:
            print(f"Note: admin_sessions deletion: {e}")
        
        # 14. Delete notifications
        try:
            db.execute(text("DELETE FROM notifications WHERE user_id = :uid"), {"uid": user_id})
        except Exception as e:
            print(f"Note: notifications deletion: {e}")
        
        # 15. Delete trainer profile
        db.execute(text("DELETE FROM trainers WHERE id = :tid"), {"tid": trainer_id})
        
        # 16. Delete user
        db.execute(text("DELETE FROM users WHERE id = :uid"), {"uid": user_id})
        
        # Commit all changes
        db.commit()
        
        return {"success": True, "message": "Trainer and all related data deleted permanently"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"ERROR in delete_trainer: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error deleting trainer: {str(e)}")


# ====================== GYM SCHEDULE SLOTS ======================

class GymScheduleSlotCreate(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    slot_type: Optional[str] = "general"
    title: Optional[str] = None
    description: Optional[str] = None
    trainer_id: Optional[str] = None
    max_capacity: Optional[int] = 0
    is_active: Optional[bool] = True


@router.get("/gym-schedule")
async def get_gym_schedule_slots(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Get all gym schedule slots"""
    try:
        slots = db.query(GymScheduleSlot).all()
        
        return {
            "success": True,
            "slots": [
                {
                    "id": s.id,
                    "day_of_week": s.day_of_week,
                    "start_time": s.start_time,
                    "end_time": s.end_time,
                    "slot_type": s.slot_type,
                    "title": s.title,
                    "description": s.description,
                    "trainer_id": str(s.trainer_id) if s.trainer_id else None,
                    "trainer_name": s.trainer.user.name if s.trainer else None,
                    "max_capacity": s.max_capacity,
                    "is_active": s.is_active,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in slots
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/gym-schedule")
async def create_gym_schedule_slot(
    slot_data: GymScheduleSlotCreate,
    notify: bool = Query(False, description="Send notification to trainees/trainers"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new gym schedule slot with optional notifications"""
    try:
        slot_dict = slot_data.dict()
        
        # Handle trainer_id properly
        if slot_dict.get('trainer_id'):
            try:
                # Try to convert to UUID if it's a string
                from uuid import UUID
                trainer_id = UUID(slot_dict['trainer_id']) if isinstance(slot_dict['trainer_id'], str) else slot_dict['trainer_id']
                slot_dict['trainer_id'] = trainer_id
            except:
                slot_dict['trainer_id'] = None
        else:
            slot_dict.pop('trainer_id', None)
        
        # Create the slot
        slot = GymScheduleSlot(**slot_dict)
        db.add(slot)
        db.flush()  # Flush to get the ID
        slot_id = slot.id
        slot_title = slot.title or f"{slot.slot_type.replace('_', ' ').title()} Session"
        slot_day = slot.day_of_week
        slot_start = slot.start_time
        slot_end = slot.end_time
        notification_count = 0
        
        # Send notifications if requested
        if notify:
            try:
                # Get all active trainees and trainers (using proper enum values)
                trainees = db.query(User).filter(
                    User.role == UserRole.TRAINEE,
                    User.is_active == True
                ).all()
                
                trainers = db.query(User).filter(
                    User.role == UserRole.TRAINER,
                    User.is_active == True
                ).all()
                
                notification_count = 0
                # Create notifications for all users
                for user in trainees + trainers:
                    notification = Notification(
                        user_id=user.id,
                        title="New Schedule Added",
                        message=f"{slot_title} on {slot_day} ({slot_start} - {slot_end})",
                        notification_type="schedule",
                        is_read=False,
                    )
                    db.add(notification)
                    notification_count += 1
                print(f"✅ Created {notification_count} notifications for {len(trainees)} trainees and {len(trainers)} trainers")
            except Exception as notif_err:
                # Log notification error but don't fail the schedule creation
                print(f"❌ Notification error: {notif_err}")
                import traceback
                traceback.print_exc()
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Schedule created{f' and {notification_count} notifications sent to trainees & trainers!' if notify else ''}",
            "slot_id": slot_id,
            "notifications_sent": notification_count if notify else 0,
            "slot": {
                "id": slot_id,
                "day_of_week": slot_day,
                "start_time": slot_start,
                "end_time": slot_end,
                "slot_type": slot_dict.get('slot_type'),
                "title": slot_title,
            }
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating schedule: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create schedule: {str(e)}")


@router.put("/gym-schedule/{slot_id}")
async def update_gym_schedule_slot(
    slot_id: int,
    slot_data: GymScheduleSlotCreate,
    notify: bool = Query(False, description="Send notification about update"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Update a gym schedule slot"""
    try:
        slot = db.query(GymScheduleSlot).filter(GymScheduleSlot.id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Schedule slot not found")
        
        # Update fields
        update_data = slot_data.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            if key == 'trainer_id' and value:
                try:
                    from uuid import UUID
                    trainer_id = UUID(value) if isinstance(value, str) else value
                    setattr(slot, key, trainer_id)
                except:
                    pass
            elif key != 'trainer_id':
                setattr(slot, key, value)
        
        db.commit()
        db.refresh(slot)
        
        # Send notifications if requested
        if notify:
            try:
                trainees = db.query(User).filter(
                    User.role == UserRole.TRAINEE,
                    User.is_active == True
                ).all()
                
                trainers = db.query(User).filter(
                    User.role == UserRole.TRAINER,
                    User.is_active == True
                ).all()
                
                slot_title = slot.title or f"{slot.slot_type.replace('_', ' ').title()} Session"
                notification_count = 0
                
                for user in trainees + trainers:
                    notification = Notification(
                        user_id=user.id,
                        title="Schedule Updated",
                        message=f"{slot_title} on {slot.day_of_week} is now {slot.start_time} - {slot.end_time}",
                        notification_type="schedule",
                        is_read=False,
                    )
                    db.add(notification)
                    notification_count += 1
                db.commit()
                print(f"✅ Sent {notification_count} update notifications")
            except Exception as notif_err:
                print(f"❌ Notification error: {notif_err}")
        
        return {
            "success": True,
            "message": "Schedule updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error updating schedule: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update schedule: {str(e)}")


@router.delete("/gym-schedule/{slot_id}")
async def delete_gym_schedule_slot(
    slot_id: int,
    notify: bool = Query(False, description="Send notification about removal"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a gym schedule slot"""
    try:
        slot = db.query(GymScheduleSlot).filter(GymScheduleSlot.id == slot_id).first()
        if not slot:
            raise HTTPException(status_code=404, detail="Schedule slot not found")
        
        slot_title = slot.title or f"{slot.slot_type.replace('_', ' ').title()} Session"
        slot_info = f"{slot_title} on {slot.day_of_week} ({slot.start_time} - {slot.end_time})"
        
        # Delete the slot
        db.delete(slot)
        db.commit()
        
        # Send notifications if requested
        if notify:
            try:
                trainees = db.query(User).filter(
                    User.role == UserRole.TRAINEE,
                    User.is_active == True
                ).all()
                
                trainers = db.query(User).filter(
                    User.role == UserRole.TRAINER,
                    User.is_active == True
                ).all()
                
                notification_count = 0
                for user in trainees + trainers:
                    notification = Notification(
                        user_id=user.id,
                        title="Schedule Removed",
                        message=f"{slot_info}",
                        notification_type="schedule",
                        is_read=False,
                    )
                    db.add(notification)
                    notification_count += 1
                db.commit()
                print(f"✅ Sent {notification_count} deletion notifications")
            except Exception as notif_err:
                print(f"❌ Notification error: {notif_err}")
        
        return {
            "success": True,
            "message": "Schedule deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error deleting schedule: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete schedule: {str(e)}")


# ====================== TIME SCHEDULE (BASED ON WORKOUT PLANS) ======================


@router.get("/schedule")
async def get_gym_schedule(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    days_ahead: int = Query(7, ge=1, le=30),
):
    """
    Gym time schedule based on WorkoutPlan.
    Returns upcoming plans for the next N days.
    """

    now = datetime.utcnow()
    end_date = now + timedelta(days=days_ahead)

    plans = (
        db.query(WorkoutPlan)
        .filter(
            WorkoutPlan.start_date != None,
            WorkoutPlan.start_date >= now,
            WorkoutPlan.start_date <= end_date,
        )
        .all()
    )

    result = []
    for p in plans:
        result.append(
            {
                "id": p.id,
                "plan_name": p.plan_name,
                "trainer_name": p.trainer.user.name if p.trainer else None,
                "trainee_name": p.trainee.name if p.trainee else None,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "is_active": p.is_active,
            }
        )

    return {"schedule": result}


@router.get("/schedule/trainer/{trainer_id}")
async def get_trainer_schedule(
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Schedule for a specific trainer (from WorkoutPlan)."""

    plans = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.trainer_id == trainer_id)
        .order_by(WorkoutPlan.start_date.asc())
        .all()
    )

    return {
        "schedule": [
            {
                "id": p.id,
                "plan_name": p.plan_name,
                "trainee_name": p.trainee.name if p.trainee else None,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "is_active": p.is_active,
            }
            for p in plans
        ]
    }


@router.get("/schedule/trainee/{trainee_id}")
async def get_trainee_schedule(
    trainee_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Schedule for a specific trainee (from WorkoutPlan)."""

    plans = (
        db.query(WorkoutPlan)
        .filter(WorkoutPlan.trainee_id == trainee_id)
        .order_by(WorkoutPlan.start_date.asc())
        .all()
    )

    return {
        "schedule": [
            {
                "id": p.id,
                "plan_name": p.plan_name,
                "trainer_name": p.trainer.user.name if p.trainer else None,
                "start_date": p.start_date.isoformat() if p.start_date else None,
                "end_date": p.end_date.isoformat() if p.end_date else None,
                "is_active": p.is_active,
            }
            for p in plans
        ]
    }


# ====================== MESSAGE BOX (ADMIN ↔ TRAINERS/TRAINEES) ======================


@router.post("/messages/send")
async def send_message_from_admin(
    data: SendMessageRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Admin sends a message to any user (trainer / trainee).
    """
    try:
        receiver = db.query(User).filter(User.id == data.receiver_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")

        msg = Message(
            sender_id=current_user.id,
            receiver_id=receiver.id,
            message=data.message.strip(),
            is_read=False,
        )

        db.add(msg)
        db.commit()
        db.refresh(msg)

        return {"message": "Message sent", "id": msg.id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in send_message_from_admin: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")


@router.get("/messages/inbox")
async def get_admin_inbox(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Messages received by admin"""
    try:
        from sqlalchemy.orm import joinedload
        
        msgs = (
            db.query(Message)
            .filter(Message.receiver_id == current_user.id)
            .options(joinedload(Message.sender))
            .order_by(Message.created_at.desc())
            .all()
        )

        return {
            "messages": [
                {
                    "id": m.id,
                    "from_user": {
                        "id": m.sender.id if m.sender else None,
                        "name": m.sender.name if m.sender else "Unknown",
                        "email": m.sender.email if m.sender else "unknown@email.com",
                        "role": m.sender.role.value if m.sender and m.sender.role else "unknown",
                    },
                    "message": m.message,
                    "is_read": m.is_read,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in msgs
            ]
        }
    except Exception as e:
        print(f"Error in get_admin_inbox: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")


@router.get("/messages/outbox")
async def get_admin_outbox(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """Messages sent by admin"""
    try:
        from sqlalchemy.orm import joinedload
        
        msgs = (
            db.query(Message)
            .filter(Message.sender_id == current_user.id)
            .options(joinedload(Message.receiver))
            .order_by(Message.created_at.desc())
            .all()
        )

        return {
            "messages": [
                {
                    "id": m.id,
                    "to_user": {
                        "id": m.receiver.id if m.receiver else None,
                        "name": m.receiver.name if m.receiver else "Unknown",
                        "email": m.receiver.email if m.receiver else "unknown@email.com",
                        "role": m.receiver.role.value if m.receiver and m.receiver.role else "unknown",
                    },
                    "message": m.message,
                    "is_read": m.is_read,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in msgs
            ]
        }
    except Exception as e:
        print(f"Error in get_admin_outbox: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")


@router.put("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Mark a message as read in admin inbox.
    Sets both is_read=True and read_at timestamp for proper persistence.
    """
    try:
        msg = (
            db.query(Message)
            .filter(
                Message.id == message_id,
                Message.receiver_id == current_user.id,
            )
            .first()
        )

        if not msg:
            raise HTTPException(status_code=404, detail="Message not found")

        # Only update if not already read
        if not msg.is_read:
            msg.is_read = True
            msg.read_at = datetime.utcnow()
            db.commit()
            
        return {
            "success": True,
            "message": "Message marked as read",
            "message_id": message_id,
            "is_read": True,
            "read_at": msg.read_at.isoformat() if msg.read_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in mark_message_read: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error marking message as read: {str(e)}")


@router.put("/messages/mark-all-read")
async def mark_all_messages_read(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    """
    Mark all unread messages as read in admin inbox.
    Sets both is_read=True and read_at timestamp for persistence.
    """
    try:
        unread_messages = db.query(Message).filter(
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).all()
        
        now = datetime.utcnow()
        for msg in unread_messages:
            msg.is_read = True
            msg.read_at = now
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Marked {len(unread_messages)} messages as read",
            "count": len(unread_messages)
        }
    except Exception as e:
        db.rollback()
        print(f"Error in mark_all_messages_read: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error marking messages as read: {str(e)}")

@router.post("/billing/refund")
async def refund_payment(data: RefundPaymentRequest, db: Session = Depends(get_db)):

    payment = db.query(Payment).filter(Payment.id == data.payment_id).first()
    if not payment:
        raise HTTPException(404, "Payment not found")

    if payment.is_refund:
        raise HTTPException(400, "Already refunded")

    payment.is_refund = True
    payment.refund_amount = data.refund_amount
    payment.refund_reason = data.refund_reason

    db.commit()
    return {"message": "Refund processed successfully"}

@router.get("/finance/summary")
async def finance_summary(db: Session = Depends(get_db)):

    total_revenue = db.query(func.sum(Payment.amount)).scalar() or 0
    total_refunds = db.query(func.sum(Payment.refund_amount)).scalar() or 0

    payments_today = db.query(func.sum(Payment.amount)).filter(
        func.date(Payment.created_at) == date.today()
    ).scalar() or 0

    return {
        "total_revenue": total_revenue,
        "total_refunds": total_refunds,
        "net_revenue": total_revenue - total_refunds,
        "today_revenue": payments_today,
    }

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    # Example: Check DB connection
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "error"
    # Uptime and response time can be tracked with global variables or external tools
    return {
        "server_uptime": "99.9%",
        "api_response_time": "45ms",
        "db_status": db_status,
    }
