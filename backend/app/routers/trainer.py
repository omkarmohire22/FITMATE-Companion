from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    WebSocket,
    WebSocketDisconnect,
    Query
)
from sqlalchemy.orm import Session
from typing import Dict, List
from datetime import datetime

from app.database import get_db
from app.auth_util import get_admin_user
from app.schemas import CreateTrainerRequest
from typing import Optional
from app.schemas import UpdateTrainerRequest
from app.schemas import AssignTraineeRequest
from app.schemas import TrainerAttendanceRequest
from app.schemas import UpdateSalaryRequest
from app.schemas import PTPackageRequest
from app.schemas import TrainerScheduleRequest
from app.schemas import TraineeAttendanceMarkRequest
from app.schemas import TraineeScheduleAssignRequest
from app.models import (
    User,
    UserRole,
    Trainer,
    Trainee,
    Workout,
    Attendance,
    TrainerRevenue,
    TrainerSalary,
    TrainerAttendance,
    TrainerSchedule,
    PTPackage,
    Notification,      # ✅ Added for trainer notifications
    # 👇 adjust these two names to your real models if different
    AIReport,          # model with (id, trainee_id, workout_id, report_type, report_json, created_at)
    TrainerMessage     # model with (id, trainee_id, trainer_id, sender_id, receiver_id, message, created_at)
)
from sqlalchemy import func
import secrets
from app.auth_util import get_current_user, verify_token, get_password_hash

router = APIRouter(
    tags=["Trainer"]
)

# =========================================================
#  HELPER: only trainer or admin can access these routes
# =========================================================

def require_trainer_or_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role not in (UserRole.TRAINER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainer or admin access required"
        )
    return current_user


def get_trainer_profile(
    db: Session,
    current_user: User
) -> Trainer:
    """
    Get Trainer row for logged-in trainer user.
    If admin, returns None (admin can see all).
    """
    if current_user.role == UserRole.TRAINER:
        trainer = db.query(Trainer).filter(
            Trainer.user_id == current_user.id
        ).first()
        if not trainer:
            raise HTTPException(
                status_code=404,
                detail="Trainer profile not found"
            )
        return trainer
    return None


def ensure_trainee_access(
    db: Session,
    current_user: User,
    trainee_id: int
) -> Trainee:
    """
    Ensure the current user (trainer/admin) can access this trainee.
    - Trainer: only their assigned trainees.
    - Admin: any trainee.
    """
    trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")

    if current_user.role == UserRole.TRAINER:
        trainer = get_trainer_profile(db, current_user)
        if trainee.trainer_id != trainer.id:
            raise HTTPException(
                status_code=403,
                detail="You are not assigned to this trainee"
            )

    return trainee


# =========================================================
#  DASHBOARD: used by TrainerDashboard (GET /api/trainer/dashboard)
# =========================================================

@router.get("/dashboard")
def get_trainer_dashboard(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Trainer:
      - number of assigned trainees
      - total workouts across their trainees
    Admin:
      - global view
    """
    if current_user.role == UserRole.TRAINER:
        trainer = get_trainer_profile(db, current_user)

        trainee_q = db.query(Trainee).filter(
            Trainee.trainer_id == trainer.id
        )

        total_trainees = trainee_q.count()

        total_workouts = (
            db.query(Workout)
            .join(Trainee, Workout.trainee_id == Trainee.id)
            .filter(Trainee.trainer_id == trainer.id)
            .count()
        )

    else:  # admin
        total_trainees = db.query(Trainee).count()
        total_workouts = db.query(Workout).count()

    return {
        "total_trainees": total_trainees,
        "total_workouts": total_workouts,
    }


# =========================================================
#  TRAINEE LIST: GET /api/trainer/trainees
#  used in TraineeDetails.jsx
# =========================================================

@router.get("/trainees")
def list_trainer_trainees(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Trainer: only own trainees
    Admin: all trainees
    """
    if current_user.role == UserRole.TRAINER:
        trainer = get_trainer_profile(db, current_user)
        trainees = db.query(Trainee).filter(
            Trainee.trainer_id == trainer.id
        ).all()
    else:
        trainees = db.query(Trainee).all()

    result = []
    for t in trainees:
        u = t.user  # relationship from Trainee -> User
        result.append({
            "id": t.id,                 # 👈 Trainee ID (used in /trainer/trainee/:id route)
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "fitness_level": getattr(t, "fitness_level", None),
            "joined_at": u.created_at.isoformat() if u.created_at else None,
            # Enhanced fields
            "goal": t.goal,
            "weight": t.weight,
            "height": t.height,
            "target_weight": t.target_weight,
            "fitness_goals": t.fitness_goals,
            "date_of_birth": t.date_of_birth.isoformat() if t.date_of_birth else None,
            "gender": t.gender,
            "address": t.address,
            "emergency_contact_name": t.emergency_contact_name,
            "emergency_contact_phone": t.emergency_contact_phone,
            "health_conditions": t.health_conditions,
        })

    return {"trainees": result}


# =========================================================
#  TRAINER PROFILE MANAGEMENT
# =========================================================

@router.get("/profile")
async def get_my_profile(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get current trainer's profile"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer profile not found")
    
    return {
        "id": trainer.id,
        "user_id": trainer.user_id,
        "name": trainer.user.name,
        "email": trainer.user.email,
        "phone": trainer.user.phone,
        "specialization": trainer.specialization,
        "experience_years": trainer.experience_years,
        "certifications": trainer.certifications,
        "bio": getattr(trainer, 'bio', None),
        "created_at": trainer.user.created_at.isoformat() if trainer.user.created_at else None
    }


@router.put("/profile")
async def update_my_profile(
    data: dict,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Update current trainer's profile"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer profile not found")
    
    # Update user info
    if data.get("name"):
        trainer.user.name = data["name"]
    if data.get("phone"):
        trainer.user.phone = data["phone"]
    
    # Update trainer-specific info
    if data.get("specialization"):
        trainer.specialization = data["specialization"]
    if "experience_years" in data:
        trainer.experience_years = data["experience_years"]
    if data.get("certifications"):
        trainer.certifications = data["certifications"]
    if "bio" in data and hasattr(trainer, 'bio'):
        trainer.bio = data["bio"]
    
    db.commit()
    return {"message": "Profile updated successfully"}


# =========================================================
#  WORKOUTS: GET /api/trainer/trainees/{id}/workouts
# =========================================================

@router.get("/trainees/{trainee_id}/workouts")
def get_trainee_workouts(
    trainee_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    trainee = ensure_trainee_access(db, current_user, trainee_id)

    workouts = (
      db.query(Workout)
      .filter(Workout.trainee_id == trainee.id)
      .order_by(Workout.start_time.desc())
      .all()
    )

    return {
        "workouts": [
            {
                "id": w.id,
                "exercise_type": getattr(w, "exercise_type", None),
                "total_reps": getattr(w, "total_reps", None),
                "avg_accuracy": getattr(w, "avg_accuracy", None),
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in workouts
        ]
    }


# =========================================================
#  AI REPORTS: GET /api/trainer/trainees/{id}/ai-reports
#  (Used in TraineeDetails.jsx → reports section)
# =========================================================

@router.get("/trainees/{trainee_id}/ai-reports")
def get_trainee_ai_reports(
    trainee_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    trainee = ensure_trainee_access(db, current_user, trainee_id)

    reports = (
        db.query(AIReport)
        .filter(AIReport.trainee_id == trainee.id)
        .order_by(AIReport.created_at.desc())
        .all()
    )

    return {
        "reports": [
            {
                "id": r.id,
                "workout_id": r.workout_id,
                "report_type": r.report_type,
                "report_json": r.report_json,  # should be dict/JSON type
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports
        ]
    }


# =========================================================
#  MESSAGES (HTTP): GET & POST
#  /api/trainer/trainees/{id}/messages
# =========================================================

@router.get("/trainees/{trainee_id}/messages")
def get_trainer_trainee_messages(
    trainee_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    trainee = ensure_trainee_access(db, current_user, trainee_id)

    trainer = None
    if current_user.role == UserRole.TRAINER:
        trainer = get_trainer_profile(db, current_user)

    # Admin can see all messages with this trainee (any trainer)
    query = db.query(TrainerMessage).filter(
        TrainerMessage.trainee_id == trainee.id
    )

    if trainer:
        query = query.filter(TrainerMessage.trainer_id == trainer.id)

    messages = query.order_by(TrainerMessage.created_at.asc()).all()

    return [
        {
            "id": m.id,
            "trainee_id": m.trainee_id,
            "trainer_id": m.trainer_id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("/trainees/{trainee_id}/messages")
def send_trainer_trainee_message(
    trainee_id: int,
    payload: Dict[str, str],
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """
    Body: {"message": "text here"}
    """
    trainee = ensure_trainee_access(db, current_user, trainee_id)
    trainer = get_trainer_profile(db, current_user) if current_user.role == UserRole.TRAINER else None

    message_text = (payload.get("message") or "").strip()
    if not message_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    if trainer is None and current_user.role == UserRole.ADMIN:
        # For simplicity: admin messages stored with trainer_id = None
        trainer_id = None
        receiver_id = trainee.user_id
    else:
        trainer_id = trainer.id
        # if trainer sends message → receiver is trainee user
        receiver_id = trainee.user_id

    msg = TrainerMessage(
        trainee_id=trainee.id,
        trainer_id=trainer_id,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        message=message_text,
        created_at=datetime.utcnow()
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)

    # If receiver is admin, create notification
    receiver_user = db.query(User).filter(User.id == receiver_id).first()
    if receiver_user and receiver_user.role == "ADMIN":
        notif = Notification(
            user_id=receiver_user.id,
            title="New message from Trainer",
            message=message_text,
            notification_type="message"
        )
        db.add(notif)
        db.commit()

    return {
        "id": msg.id,
        "message": msg.message,
        "created_at": msg.created_at.isoformat()
    }


# =========================================================
#  REAL-TIME CHAT (WebSocket)
#  /api/trainer/ws/trainees/{id}?token=ACCESS_TOKEN
#  (STEP 5)
# =========================================================

class ConnectionManager:
  def __init__(self):
      self.rooms: Dict[str, List[WebSocket]] = {}

  async def connect(self, room: str, websocket: WebSocket):
      await websocket.accept()
      self.rooms.setdefault(room, []).append(websocket)

  def disconnect(self, room: str, websocket: WebSocket):
      if room in self.rooms:
          self.rooms[room] = [
              ws for ws in self.rooms[room] if ws is not websocket
          ]

  async def broadcast(self, room: str, message: dict):
      for ws in self.rooms.get(room, []):
          await ws.send_json(message)


ws_manager = ConnectionManager()


@router.websocket("/ws/trainees/{trainee_id}")
async def trainer_trainee_chat_ws(
    websocket: WebSocket,
    trainee_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Simple WebSocket room between trainer & trainee.
    Frontend should connect like:
      ws://HOST/api/trainer/ws/trainees/123?token=ACCESS_TOKEN
    """

    # 1) Authenticate using JWT access token
    try:
        payload = verify_token(token, token_type="access")
        user_id = int(payload.get("sub"))
    except Exception:
        await websocket.close(code=4401)  # unauthorized
        return

    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user or current_user.role not in (UserRole.TRAINER, UserRole.ADMIN):
        await websocket.close(code=4403)  # forbidden
        return

    # 2) Check trainee access
    trainee = ensure_trainee_access(db, current_user, trainee_id)

    room = f"trainee-{trainee.id}"
    await ws_manager.connect(room, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            text = (data.get("message") or "").strip()
            if not text:
                continue

            # Save to DB as well
            trainer = get_trainer_profile(db, current_user) if current_user.role == UserRole.TRAINER else None
            trainer_id = trainer.id if trainer else None

            msg = TrainerMessage(
                trainee_id=trainee.id,
                trainer_id=trainer_id,
                sender_id=current_user.id,
                receiver_id=trainee.user_id,
                message=text,
                created_at=datetime.utcnow()
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            await ws_manager.broadcast(room, {
                "id": msg.id,
                "sender_id": msg.sender_id,
                "message": msg.message,
                "created_at": msg.created_at.isoformat()
            })

    except WebSocketDisconnect:
        ws_manager.disconnect(room, websocket)
@router.post("/trainers/create")
async def create_trainer_enhanced(
    data: CreateTrainerRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Enhanced trainer creation with salary configuration"""
    
    # Check if email exists
    existing = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing:
        raise HTTPException(400, "Email already registered")
    
    # Generate temporary password
    temp_password = secrets.token_urlsafe(8)
    hashed_password = get_password_hash(temp_password)
    
    # Create User
    user = User(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        phone=data.phone,
        password_hash=hashed_password,
        role=UserRole.TRAINER,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create Trainer Profile
    trainer = Trainer(
        user_id=user.id,
        specialization=data.specialization,
        experience_years=data.experience_years,
        certifications=data.certifications
    )
    db.add(trainer)
    db.commit()
    db.refresh(trainer)
    
    # Create Salary Configuration
    salary_config = TrainerSalary(
        trainer_id=trainer.id,
        salary_model=data.salary_model,
        base_salary=data.base_salary or data.salary_amount,
        commission_per_trainee=data.commission_rate if data.salary_model == 'per_trainee' else None,
        commission_per_session=data.commission_rate if data.salary_model == 'per_session' else None,
        is_active=True
    )
    db.add(salary_config)
    db.commit()
    
    return {
        "message": "Trainer created successfully",
        "trainer_id": str(trainer.id),
        "user_id": user.id,
        "email": user.email,
        "temp_password": temp_password,
        "salary_model": data.salary_model
    }


@router.get("/trainers/list")
async def get_trainers_enhanced(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100
):
    """Get all trainers with detailed information"""
    
    query = db.query(Trainer).join(User)
    
    if status:
        if status == "active":
            query = query.filter(User.is_active == True)
        elif status == "inactive":
            query = query.filter(User.is_active == False)
    
    trainers = query.offset(skip).limit(limit).all()
    
    result = []
    for trainer in trainers:
        # Get trainee count
        trainee_count = db.query(Trainee).filter(Trainee.trainer_id == trainer.id).count()
        
        # Get salary info
        salary_info = db.query(TrainerSalary).filter(
            TrainerSalary.trainer_id == trainer.id,
            TrainerSalary.is_active == True
        ).first()
        
        # Get this month's attendance
        month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        attendance_count = db.query(TrainerAttendance).filter(
            TrainerAttendance.trainer_id == trainer.id,
            TrainerAttendance.date >= month_start,
            TrainerAttendance.status == 'present'
        ).count()
        
        # Calculate monthly earnings
        monthly_earnings = calculate_trainer_earnings(db, trainer.id, salary_info)
        
        result.append({
            "id": str(trainer.id),
            "user": {
                "id": trainer.user.id,
                "name": trainer.user.name,
                "email": trainer.user.email,
                "phone": trainer.user.phone,
                "is_active": trainer.user.is_active
            },
            "specialization": trainer.specialization,
            "experience_years": trainer.experience_years,
            "certifications": trainer.certifications,
            "trainee_count": trainee_count,
            "attendance_this_month": attendance_count,
            "monthly_earnings": monthly_earnings,
            "salary_model": salary_info.salary_model if salary_info else None,
            "base_salary": float(salary_info.base_salary) if salary_info and salary_info.base_salary else 0,
            "status": "active" if trainer.user.is_active else "inactive",
            "created_at": trainer.user.created_at.isoformat() if trainer.user.created_at else None
        })
    
    return {"trainers": result, "total": len(result)}


@router.get("/trainers/{trainer_id}/details")
async def get_trainer_details(
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive trainer details"""
    
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(404, "Trainer not found")
    
    # Get assigned trainees
    trainees = db.query(Trainee).filter(Trainee.trainer_id == trainer_id).all()
    trainee_list = [{
        "id": t.user_id,
        "name": t.user.name,
        "email": t.user.email,
        "phone": t.user.phone,
        "membership_status": "active",  # You can add membership lookup
        "assigned_date": t.created_at.isoformat() if t.created_at else None
    } for t in trainees]
    
    # Get salary configuration
    salary_config = db.query(TrainerSalary).filter(
        TrainerSalary.trainer_id == trainer_id,
        TrainerSalary.is_active == True
    ).first()
    
    # Get schedule
    schedule = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer_id
    ).all()
    
    schedule_list = [{
        "id": s.id,
        "day_of_week": s.day_of_week,
        "day_name": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][s.day_of_week],
        "start_time": s.start_time.isoformat() if s.start_time else None,
        "end_time": s.end_time.isoformat() if s.end_time else None,
        "is_available": s.is_available
    } for s in schedule]
    
    # Get this month's attendance
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    attendance_records = db.query(TrainerAttendance).filter(
        TrainerAttendance.trainer_id == trainer_id,
        TrainerAttendance.date >= month_start
    ).order_by(TrainerAttendance.date.desc()).all()
    
    attendance_list = [{
        "date": a.date.isoformat(),
        "check_in": a.check_in.isoformat() if a.check_in else None,
        "check_out": a.check_out.isoformat() if a.check_out else None,
        "status": a.status,
        "hours_worked": a.hours_worked
    } for a in attendance_records]
    
    # Get PT sessions
    pt_sessions = db.query(PTSession).filter(
        PTSession.trainer_id == trainer_id
    ).order_by(PTSession.session_date.desc()).limit(10).all()
    
    return {
        "trainer": {
            "id": str(trainer.id),
            "name": trainer.user.name,
            "email": trainer.user.email,
            "phone": trainer.user.phone,
            "specialization": trainer.specialization,
            "experience_years": trainer.experience_years,
            "certifications": trainer.certifications,
            "is_active": trainer.user.is_active
        },
        "trainees": trainee_list,
        "salary_config": {
            "model": salary_config.salary_model if salary_config else None,
            "base_salary": float(salary_config.base_salary) if salary_config and salary_config.base_salary else 0,
            "commission_per_trainee": float(salary_config.commission_per_trainee) if salary_config and salary_config.commission_per_trainee else 0,
            "commission_per_session": float(salary_config.commission_per_session) if salary_config and salary_config.commission_per_session else 0
        },
        "schedule": schedule_list,
        "attendance": attendance_list,
        "monthly_earnings": calculate_trainer_earnings(db, trainer_id, salary_config)
    }


@router.put("/trainers/{trainer_id}/update")
async def update_trainer(
    trainer_id: str,
    data: UpdateTrainerRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update trainer information"""
    
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(404, "Trainer not found")
    
    # Update user info
    if data.name:
        trainer.user.name = data.name
    if data.phone:
        trainer.user.phone = data.phone
    
    # Update trainer profile
    if data.specialization:
        trainer.specialization = data.specialization
    if data.experience_years is not None:
        trainer.experience_years = data.experience_years
    if data.certifications:
        trainer.certifications = data.certifications
    
    db.commit()
    return {"message": "Trainer updated successfully"}


@router.delete("/trainers/{trainer_id}/deactivate")
async def deactivate_trainer(
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Deactivate trainer (soft delete)"""
    
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(404, "Trainer not found")
    
    # Check if trainer has active trainees
    active_trainees = db.query(Trainee).filter(Trainee.trainer_id == trainer_id).count()
    
    if active_trainees > 0:
        raise HTTPException(
            400, 
            f"Cannot deactivate trainer with {active_trainees} active trainees. Please reassign them first."
        )
    
    trainer.user.is_active = False
    db.commit()
    
    return {"message": "Trainer deactivated successfully"}


# ==================== TRAINEE ASSIGNMENT ====================

@router.post("/trainers/assign-trainee")
async def assign_trainee_to_trainer(
    data: AssignTraineeRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Assign trainee to trainer"""
    
    trainee = db.query(Trainee).filter(Trainee.user_id == data.trainee_id).first()
    if not trainee:
        raise HTTPException(404, "Trainee not found")
    
    trainer = db.query(Trainer).filter(Trainer.id == data.trainer_id).first()
    if not trainer:
        raise HTTPException(404, "Trainer not found")
    
    trainee.trainer_id = data.trainer_id
    db.commit()
    
    return {"message": "Trainee assigned successfully"}


@router.post("/trainers/reassign-trainees")
async def reassign_trainees(
    from_trainer_id: str,
    to_trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Reassign all trainees from one trainer to another"""
    
    trainees = db.query(Trainee).filter(Trainee.trainer_id == from_trainer_id).all()
    
    for trainee in trainees:
        trainee.trainer_id = to_trainer_id
    
    db.commit()
    
    return {
        "message": f"Reassigned {len(trainees)} trainees",
        "count": len(trainees)
    }


# ==================== ATTENDANCE MANAGEMENT ====================

@router.post("/trainers/attendance/mark")
async def mark_trainer_attendance(
    data: TrainerAttendanceRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Mark trainer attendance"""
    
    # Check if attendance already marked for today
    today = datetime.now().date()
    existing = db.query(TrainerAttendance).filter(
        TrainerAttendance.trainer_id == data.trainer_id,
        func.date(TrainerAttendance.date) == today
    ).first()
    
    if existing:
        # Update existing record
        existing.check_in = data.check_in
        existing.check_out = data.check_out
        existing.status = data.status
        
        if data.check_in and data.check_out:
            duration = data.check_out - data.check_in
            existing.hours_worked = duration.total_seconds() / 3600
    else:
        # Create new record
        hours_worked = None
        if data.check_in and data.check_out:
            duration = data.check_out - data.check_in
            hours_worked = duration.total_seconds() / 3600
        
        attendance = TrainerAttendance(
            trainer_id=data.trainer_id,
            date=today,
            check_in=data.check_in,
            check_out=data.check_out,
            status=data.status,
            hours_worked=hours_worked
        )
        db.add(attendance)
    
    db.commit()
    return {"message": "Attendance marked successfully"}


@router.get("/trainers/{trainer_id}/attendance")
async def get_trainer_attendance(
    trainer_id: str,
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get trainer attendance records"""
    
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    records = db.query(TrainerAttendance).filter(
        TrainerAttendance.trainer_id == trainer_id,
        TrainerAttendance.date >= start_date,
        TrainerAttendance.date < end_date
    ).order_by(TrainerAttendance.date).all()
    
    # Calculate stats
    present_days = len([r for r in records if r.status == 'present'])
    late_days = len([r for r in records if r.status == 'late'])
    absent_days = len([r for r in records if r.status == 'absent'])
    leave_days = len([r for r in records if r.status == 'leave'])
    total_hours = sum([r.hours_worked for r in records if r.hours_worked])
    
    return {
        "attendance": [{
            "date": r.date.isoformat(),
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "status": r.status,
            "hours_worked": r.hours_worked
        } for r in records],
        "stats": {
            "present_days": present_days,
            "late_days": late_days,
            "absent_days": absent_days,
            "leave_days": leave_days,
            "total_hours": round(total_hours, 2) if total_hours else 0
        }
    }


# ==================== SALARY MANAGEMENT ====================

@router.put("/trainers/{trainer_id}/salary")
async def update_trainer_salary(
    trainer_id: str,
    data: UpdateSalaryRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update trainer salary configuration"""
    
    # Deactivate old config
    old_config = db.query(TrainerSalary).filter(
        TrainerSalary.trainer_id == trainer_id,
        TrainerSalary.is_active == True
    ).first()
    
    if old_config:
        old_config.is_active = False
    
    # Create new config
    new_config = TrainerSalary(
        trainer_id=trainer_id,
        salary_model=data.salary_model,
        base_salary=data.base_salary or data.salary_amount,
        commission_per_trainee=data.commission_rate if data.salary_model == 'per_trainee' else None,
        commission_per_session=data.commission_rate if data.salary_model == 'per_session' else None,
        is_active=True
    )
    
    db.add(new_config)
    db.commit()
    
    return {"message": "Salary configuration updated"}


@router.get("/trainers/{trainer_id}/earnings")
async def get_trainer_earnings(
    trainer_id: str,
    month: Optional[int] = Query(None),
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Calculate trainer earnings for a month"""
    
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    salary_config = db.query(TrainerSalary).filter(
        TrainerSalary.trainer_id == trainer_id,
        TrainerSalary.is_active == True
    ).first()
    
    if not salary_config:
        return {"earnings": 0, "breakdown": {}}
    
    earnings = calculate_trainer_earnings(db, trainer_id, salary_config, month, year)
    
    return earnings


# ==================== HELPER FUNCTIONS ====================

def calculate_trainer_earnings(
    db: Session, 
    trainer_id: str, 
    salary_config,
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Calculate total trainer earnings"""
    
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    if not salary_config:
        return {
            "total": 0,
            "base_salary": 0,
            "trainee_commission": 0,
            "session_commission": 0
        }
    
    base_salary = float(salary_config.base_salary or 0)
    trainee_commission = 0
    session_commission = 0
    
    # Calculate trainee commission
    if salary_config.salary_model in ['per_trainee', 'hybrid']:
        trainee_count = db.query(Trainee).filter(Trainee.trainer_id == trainer_id).count()
        trainee_commission = trainee_count * float(salary_config.commission_per_trainee or 0)
    
    # Calculate session commission
    if salary_config.salary_model in ['per_session', 'hybrid']:
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        session_count = db.query(PTSession).filter(
            PTSession.trainer_id == trainer_id,
            PTSession.session_date >= start_date,
            PTSession.session_date < end_date,
            PTSession.status == 'completed'
        ).count()
        
        session_commission = session_count * float(salary_config.commission_per_session or 0)
    
    total = base_salary + trainee_commission + session_commission
    
    return {
        "total": round(total, 2),
        "base_salary": round(base_salary, 2),
        "trainee_commission": round(trainee_commission, 2),
        "session_commission": round(session_commission, 2),
        "salary_model": salary_config.salary_model
    }


# ==================== PT PACKAGE MANAGEMENT ====================

@router.post("/trainers/pt-packages/create")
async def create_pt_package(
    data: PTPackageRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create PT package"""
    
    package = PTPackage(
        name=data.name,
        sessions_count=data.sessions_count,
        price=data.price,
        duration_days=data.duration_days,
        description=data.description,
        is_active=True
    )
    
    db.add(package)
    db.commit()
    db.refresh(package)
    
    return {
        "message": "PT package created",
        "package_id": package.id
    }


@router.get("/pt-packages")
async def get_pt_packages_for_trainer(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get all PT packages for trainer"""
    
    packages = db.query(PTPackage).filter(PTPackage.is_active == True).all()
    
    return {
        "packages": [{
            "id": p.id,
            "name": p.name,
            "sessions_count": p.sessions_count,
            "price": float(p.price),
            "duration_days": p.duration_days,
            "description": p.description
        } for p in packages]
    }


@router.get("/trainers/pt-packages")
async def get_pt_packages(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get all PT packages"""
    
    packages = db.query(PTPackage).filter(PTPackage.is_active == True).all()
    
    return {
        "packages": [{
            "id": p.id,
            "name": p.name,
            "sessions_count": p.sessions_count,
            "price": float(p.price),
            "duration_days": p.duration_days,
            "description": p.description
        } for p in packages]
    }


# ==================== TRAINEE ATTENDANCE (FOR TRAINER) ====================

@router.get("/attendance/summary")
def get_trainer_attendance_summary(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get attendance summary for all trainees assigned to this trainer"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not a trainer")

    if current_user.role == UserRole.TRAINER:
        trainees = db.query(Trainee).filter(Trainee.trainer_id == trainer.id).all()
    else:
        trainees = db.query(Trainee).all()

    summary = {}
    for t in trainees:
        # Get attendance records for this trainee (by user_id since Attendance uses users.id)
        records = db.query(Attendance).filter(Attendance.trainee_id == t.user_id).all()
        total = len(records)
        
        # Count "present" as having a check_in_time (successful check-in)
        # The Attendance model tracks check-ins, so any record = present
        present = len([r for r in records if r.check_in_time is not None])
        
        # Calculate attendance percentage based on expected days
        # For now, we use total records as base (each record = 1 day attempted)
        summary[str(t.id)] = {
            "total_days": total,
            "present": present,
            "absent": 0,  # With check-in model, absence = no record for that day
            "percentage": round((present / max(total, 1) * 100), 1) if total > 0 else 0,
            "last_check_in": max((r.check_in_time for r in records if r.check_in_time), default=None)
        }
        
        # Convert last_check_in to string for JSON serialization
        if summary[str(t.id)]["last_check_in"]:
            summary[str(t.id)]["last_check_in"] = summary[str(t.id)]["last_check_in"].isoformat()

    return summary


@router.post("/trainees/{trainee_id}/attendance/mark")
def mark_trainee_attendance(
    trainee_id: int,
    data: TraineeAttendanceMarkRequest,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Mark attendance for a specific trainee"""
    trainee = ensure_trainee_access(db, current_user, trainee_id)
    
    attendance_date = data.date or date.today()
    
    # Check if already marked for this date
    # Note: Attendance model uses check_in_time (DateTime), so we check the date part
    existing = db.query(Attendance).filter(
        Attendance.trainee_id == trainee.user_id,
        func.date(Attendance.check_in_time) == attendance_date
    ).first()
    
    if data.status == 'present':
        # Mark as present by creating/updating check-in record
        if existing:
            # Already has a check-in for this day, just update the method
            existing.check_in_method = "trainer_manual"
        else:
            new_attendance = Attendance(
                trainee_id=trainee.user_id,
                check_in_time=datetime.combine(attendance_date, datetime.min.time()) if data.date else datetime.utcnow(),
                check_in_method="trainer_manual"
            )
            db.add(new_attendance)
    elif data.status == 'absent':
        # Mark as absent by removing any existing check-in record for that day
        if existing:
            db.delete(existing)
    
    db.commit()
    return {"message": f"Attendance marked as {data.status}"}


# ==================== EARNINGS (FOR TRAINER) ====================

@router.get("/earnings/summary")
def get_trainer_earnings_summary(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get earnings summary for the logged-in trainer"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")

    # Get revenue records
    revenue = db.query(TrainerRevenue).filter(TrainerRevenue.trainer_id == trainer.id).all()
    total_earnings = sum(r.amount for r in revenue)
    
    # Monthly earnings
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    monthly_revenue = db.query(TrainerRevenue).filter(
        TrainerRevenue.trainer_id == trainer.id,
        TrainerRevenue.created_at >= month_start
    ).all()
    monthly_earnings = sum(r.amount for r in monthly_revenue)

    return {
        "total_earnings": total_earnings,
        "monthly_earnings": monthly_earnings,
        "currency": "INR"
    }


# ==================== ACTIVITY (FOR TRAINER) ====================

@router.get("/activity")
def get_trainer_activity(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get recent activity for the logged-in trainer"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")

    # Recent messages
    messages = db.query(TrainerMessage).filter(
        TrainerMessage.trainer_id == trainer.id
    ).order_by(TrainerMessage.created_at.desc()).limit(5).all()
    
    # Recent workouts
    workouts = db.query(Workout).join(Trainee, Workout.trainee_id == Trainee.user_id).filter(
        Trainee.trainer_id == trainer.id
    ).order_by(Workout.start_time.desc()).limit(5).all()
    
    activities = []
    for m in messages:
        activities.append({
            "user": m.sender.name if m.sender_id != current_user.id else m.receiver.name,
            "action": "Sent a message" if m.sender_id != current_user.id else "You sent a message",
            "icon": "MessageCircle",
            "color": "text-orange-500",
            "bgColor": "bg-orange-100",
            "time": m.created_at.isoformat()
        })
        
    for w in workouts:
        trainee_user = w.trainee
        if w.start_time:  # Only add if we have a valid time
            activities.append({
                "user": trainee_user.name if trainee_user else "Unknown",
                "action": f"Completed {w.exercise_type or 'a'} workout",
                "icon": "CheckCircle",
                "color": "text-purple-500",
                "bgColor": "bg-purple-100",
                "time": w.start_time.isoformat()
            })
        
    # Sort by time (filter out None times first)
    activities = [a for a in activities if a.get('time')]
    activities.sort(key=lambda x: x['time'], reverse=True)
    
    return activities[:10]


# ==================== SCHEDULE MANAGEMENT ====================

@router.get("/schedule")
async def get_my_schedule(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get logged-in trainer's weekly schedule with trainee assignments"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")

    schedule = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer.id
    ).order_by(TrainerSchedule.day_of_week, TrainerSchedule.start_time).all()
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    result = []
    for s in schedule:
        slot_data = {
            "id": s.id,
            "day_of_week": s.day_of_week,
            "day_name": days[s.day_of_week] if s.day_of_week < 7 else "Unknown",
            "start_time": s.start_time.strftime("%H:%M") if s.start_time else None,
            "end_time": s.end_time.strftime("%H:%M") if s.end_time else None,
            "is_available": s.is_available,
            "session_type": getattr(s, 'session_type', None),
            "notes": getattr(s, 'notes', None),
            "trainee": None
        }
        
        # Include trainee info if assigned
        if s.trainee_id:
            trainee = db.query(Trainee).filter(Trainee.id == s.trainee_id).first()
            if trainee:
                slot_data["trainee"] = {
                    "id": trainee.id,
                    "name": trainee.user.name,
                    "email": trainee.user.email
                }
        
        result.append(slot_data)
    
    return {"schedule": result}


@router.post("/schedule")
async def add_my_schedule(
    data: TrainerScheduleRequest,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Add/Update trainer's schedule slot"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")
    
    # Validate time range
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Check if exact schedule already exists for this slot
    existing = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer.id,
        TrainerSchedule.day_of_week == data.day_of_week,
        TrainerSchedule.start_time == data.start_time,
        TrainerSchedule.end_time == data.end_time
    ).first()
    
    if existing:
        existing.is_available = data.is_available
        db.commit()
        return {"message": "Schedule slot updated successfully", "id": existing.id}
    
    # Check for overlapping time slots on the same day
    overlapping = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer.id,
        TrainerSchedule.day_of_week == data.day_of_week,
        TrainerSchedule.start_time < data.end_time,
        TrainerSchedule.end_time > data.start_time
    ).first()
    
    if overlapping:
        raise HTTPException(
            status_code=400, 
            detail=f"Time slot overlaps with existing slot ({overlapping.start_time.strftime('%H:%M')} - {overlapping.end_time.strftime('%H:%M')})"
        )
    
    schedule = TrainerSchedule(
        trainer_id=trainer.id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        is_available=data.is_available
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return {"message": "Schedule slot added successfully", "id": schedule.id}


@router.put("/schedule/{schedule_id}")
async def update_my_schedule(
    schedule_id: int,
    data: TrainerScheduleRequest,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Update trainer's schedule slot"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")
    
    # Validate time range
    if data.start_time >= data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    schedule = db.query(TrainerSchedule).filter(
        TrainerSchedule.id == schedule_id,
        TrainerSchedule.trainer_id == trainer.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # Check for overlapping time slots (excluding current slot)
    overlapping = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer.id,
        TrainerSchedule.day_of_week == data.day_of_week,
        TrainerSchedule.id != schedule_id,  # Exclude current slot
        TrainerSchedule.start_time < data.end_time,
        TrainerSchedule.end_time > data.start_time
    ).first()
    
    if overlapping:
        raise HTTPException(
            status_code=400, 
            detail=f"Time slot overlaps with existing slot ({overlapping.start_time.strftime('%H:%M')} - {overlapping.end_time.strftime('%H:%M')})"
        )
    
    schedule.day_of_week = data.day_of_week
    schedule.start_time = data.start_time
    schedule.end_time = data.end_time
    schedule.is_available = data.is_available
    
    db.commit()
    return {"message": "Schedule updated successfully"}


@router.delete("/schedule/{schedule_id}")
async def delete_my_schedule(
    schedule_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Delete trainer's schedule slot"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")
    
    schedule = db.query(TrainerSchedule).filter(
        TrainerSchedule.id == schedule_id,
        TrainerSchedule.trainer_id == trainer.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    # If trainee is assigned, notify them about cancellation before deleting
    if schedule.trainee_id:
        trainee = db.query(Trainee).filter(Trainee.id == schedule.trainee_id).first()
        if trainee:
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_name = days[schedule.day_of_week] if schedule.day_of_week < 7 else "Unknown"
            
            from app.models import Notification
            notification = Notification(
                user_id=trainee.user_id,
                title="⚠️ Training Session Cancelled",
                message=f"Your training session on {day_name} from {schedule.start_time.strftime('%H:%M')} to {schedule.end_time.strftime('%H:%M')} has been cancelled.",
                notification_type="schedule"
            )
            db.add(notification)
    
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}


# ==================== TRAINEE SCHEDULE ASSIGNMENT ====================

@router.post("/schedule/assign-trainee")
async def assign_trainee_to_schedule(
    data: TraineeScheduleAssignRequest,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Assign a trainee to a schedule slot and send notification"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")
    
    # Verify trainee access
    trainee = ensure_trainee_access(db, current_user, data.trainee_id)
    
    # Create or update schedule slot
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    day_name = days[data.day_of_week] if data.day_of_week < 7 else "Unknown"
    
    # Check if slot already exists
    existing = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer.id,
        TrainerSchedule.day_of_week == data.day_of_week,
        TrainerSchedule.start_time == data.start_time,
        TrainerSchedule.end_time == data.end_time
    ).first()
    
    if existing:
        existing.is_available = False  # Mark as booked
        existing.trainee_id = data.trainee_id
        existing.session_type = data.session_type
        existing.notes = data.notes
        schedule_id = existing.id
    else:
        # Create new schedule slot (booked)
        schedule = TrainerSchedule(
            trainer_id=trainer.id,
            day_of_week=data.day_of_week,
            start_time=data.start_time,
            end_time=data.end_time,
            is_available=False,  # Booked
            trainee_id=data.trainee_id,
            session_type=data.session_type,
            notes=data.notes
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        schedule_id = schedule.id
    
    db.commit()
    
    # Send notification to trainee
    if data.send_notification:
        from app.models import Notification
        notification = Notification(
            user_id=trainee.user_id,
            title="📅 New Training Session Scheduled",
            message=f"Your trainer {trainer.user.name} has scheduled a {data.session_type.replace('_', ' ')} session for you on {day_name} from {data.start_time.strftime('%H:%M')} to {data.end_time.strftime('%H:%M')}.{' Notes: ' + data.notes if data.notes else ''}",
            notification_type="schedule"
        )
        db.add(notification)
        db.commit()
    
    return {
        "message": "Trainee assigned to schedule successfully",
        "schedule_id": schedule_id,
        "notification_sent": data.send_notification
    }


@router.get("/schedule/assigned-trainees")
async def get_assigned_trainee_schedules(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get all schedules with assigned trainees for this trainer"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")
    
    # Get schedules with assigned trainees
    schedules = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer.id,
        TrainerSchedule.trainee_id.isnot(None)
    ).order_by(TrainerSchedule.day_of_week).all()
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    result = []
    for s in schedules:
        trainee = db.query(Trainee).filter(Trainee.id == s.trainee_id).first()
        result.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "day_name": days[s.day_of_week] if s.day_of_week < 7 else "Unknown",
            "start_time": s.start_time.strftime("%H:%M") if s.start_time else None,
            "end_time": s.end_time.strftime("%H:%M") if s.end_time else None,
            "session_type": getattr(s, 'session_type', 'personal_training'),
            "notes": getattr(s, 'notes', None),
            "trainee": {
                "id": trainee.id,
                "name": trainee.user.name,
                "email": trainee.user.email,
                "phone": trainee.user.phone
            } if trainee else None
        })
    
    return {"assigned_schedules": result}


@router.delete("/schedule/unassign-trainee/{schedule_id}")
async def unassign_trainee_from_schedule(
    schedule_id: int,
    send_notification: bool = True,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Remove trainee assignment from a schedule slot"""
    trainer = get_trainer_profile(db, current_user)
    if not trainer:
        raise HTTPException(status_code=403, detail="Not a trainer")
    
    schedule = db.query(TrainerSchedule).filter(
        TrainerSchedule.id == schedule_id,
        TrainerSchedule.trainer_id == trainer.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    trainee_id = getattr(schedule, 'trainee_id', None)
    
    # Send cancellation notification
    if send_notification and trainee_id:
        trainee = db.query(Trainee).filter(Trainee.id == trainee_id).first()
        if trainee:
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            day_name = days[schedule.day_of_week] if schedule.day_of_week < 7 else "Unknown"
            
            from app.models import Notification
            notification = Notification(
                user_id=trainee.user_id,
                title="⚠️ Training Session Cancelled",
                message=f"Your training session on {day_name} from {schedule.start_time.strftime('%H:%M')} to {schedule.end_time.strftime('%H:%M')} has been cancelled by your trainer.",
                notification_type="schedule"
            )
            db.add(notification)
    
    # Clear the trainee assignment but keep the slot available
    schedule.trainee_id = None
    schedule.is_available = True
    schedule.session_type = None
    schedule.notes = None
    
    db.commit()
    return {"message": "Trainee unassigned from schedule successfully"}


@router.post("/trainers/schedule/add")
async def add_trainer_schedule(
    data: TrainerScheduleRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Add trainer schedule for a day"""
    
    # Check if schedule exists
    existing = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == data.trainer_id,
        TrainerSchedule.day_of_week == data.day_of_week
    ).first()
    
    if existing:
        existing.start_time = data.start_time
        existing.end_time = data.end_time
        existing.is_available = data.is_available
    else:
        schedule = TrainerSchedule(
            trainer_id=data.trainer_id,
            day_of_week=data.day_of_week,
            start_time=data.start_time,
            end_time=data.end_time,
            is_available=data.is_available
        )
        db.add(schedule)
    
    db.commit()
    return {"message": "Schedule updated"}


@router.get("/trainers/{trainer_id}/schedule")
async def get_trainer_schedule(
    trainer_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get trainer weekly schedule"""
    
    schedule = db.query(TrainerSchedule).filter(
        TrainerSchedule.trainer_id == trainer_id
    ).order_by(TrainerSchedule.day_of_week).all()
    
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    return {
        "schedule": [{
            "day_of_week": s.day_of_week,
            "day_name": days[s.day_of_week],
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "is_available": s.is_available
        } for s in schedule]
    }


# =========================================================
#  TRAINEE PERFORMANCE ANALYTICS
# =========================================================

@router.get("/trainee/{trainee_id}/progress-summary")
def get_trainee_progress_summary(
    trainee_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get trainee's progress metrics (weight, body fat, workouts)"""
    trainee = ensure_trainee_access(db, current_user, trainee_id)
    
    # Use user_id for Measurement and Workout tables (they reference users.id, not trainees.id)
    user_id = trainee.user_id
    
    # Get measurements
    from app.models import Measurement
    measurements = db.query(Measurement).filter(
        Measurement.trainee_id == user_id
    ).order_by(Measurement.created_at).all()
    
    # Weight progress
    weight_data = [{"date": m.created_at.isoformat() if m.created_at else None, "weight": m.weight} for m in measurements if m.weight]
    
    # Body fat progress
    bodyfat_data = [{"date": m.created_at.isoformat() if m.created_at else None, "body_fat": m.body_fat} for m in measurements if m.body_fat]
    
    # Workouts
    workouts = db.query(Workout).filter(
        Workout.trainee_id == user_id
    ).all()
    
    # Calculate stats
    initial_weight = weight_data[0]['weight'] if weight_data else 0
    current_weight = weight_data[-1]['weight'] if weight_data else 0
    weight_change = current_weight - initial_weight if initial_weight else 0
    
    initial_bodyfat = bodyfat_data[0]['body_fat'] if bodyfat_data else 0
    current_bodyfat = bodyfat_data[-1]['body_fat'] if bodyfat_data else 0
    bodyfat_change = current_bodyfat - initial_bodyfat if initial_bodyfat else 0
    
    return {
        "trainee_id": trainee_id,
        "trainee_name": trainee.user.name,
        "weight_progress": {
            "initial": initial_weight,
            "current": current_weight,
            "change": weight_change,
            "data": weight_data[-30:]  # Last 30 measurements
        },
        "bodyfat_progress": {
            "initial": initial_bodyfat,
            "current": current_bodyfat,
            "change": bodyfat_change,
            "data": bodyfat_data[-30:]
        },
        "workouts": {
            "total": len(workouts),
            "completed": len([w for w in workouts if w.end_time is not None]),
            "last_workout": workouts[-1].start_time.isoformat() if workouts and workouts[-1].start_time else None
        },
        "compliance": {
            "measurement_frequency": len(measurements),
            "last_measurement": measurements[-1].created_at.isoformat() if measurements else None,
            "adherence_rate": min(100, (len(measurements) / max(1, (len(workouts) or 1))) * 100)
        }
    }


@router.get("/trainee/{trainee_id}/milestones")
def get_trainee_milestones(
    trainee_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get trainee's achievements and upcoming milestones"""
    trainee = ensure_trainee_access(db, current_user, trainee_id)
    
    # Use user_id for Measurement and Workout tables (they reference users.id, not trainees.id)
    user_id = trainee.user_id
    
    from app.models import Measurement
    
    achievements = []
    
    # Check goal-based achievements
    if trainee.target_weight:
        from app.models import Measurement
        latest_measurement = db.query(Measurement).filter(
            Measurement.trainee_id == user_id
        ).order_by(Measurement.created_at.desc()).first()
        
        if latest_measurement and latest_measurement.weight:
            weight_to_goal = abs(latest_measurement.weight - trainee.target_weight)
            
            # Milestone achievements
            if latest_measurement.weight == trainee.target_weight:
                achievements.append({
                    "title": "🎯 Goal Achieved!",
                    "description": f"Reached target weight of {trainee.target_weight}kg",
                    "achieved": True,
                    "date": latest_measurement.created_at.isoformat()
                })
            elif weight_to_goal < 5:
                achievements.append({
                    "title": "🔥 Almost There!",
                    "description": f"Only {weight_to_goal:.1f}kg away from goal",
                    "achieved": False
                })
            
            # 5% Progress milestone
            initial_weight = trainee.weight
            if initial_weight and latest_measurement.weight:
                progress_percent = abs((initial_weight - latest_measurement.weight) / initial_weight * 100)
                if progress_percent >= 5:
                    achievements.append({
                        "title": "💪 5% Progress",
                        "description": f"Lost/gained {progress_percent:.1f}% of body weight",
                        "achieved": True,
                        "date": latest_measurement.created_at.isoformat()
                    })
                if progress_percent >= 10:
                    achievements.append({
                        "title": "🌟 10% Progress",
                        "description": f"Impressive {progress_percent:.1f}% transformation",
                        "achieved": True,
                        "date": latest_measurement.created_at.isoformat()
                    })
    
    # Workout milestones
    workouts = db.query(Workout).filter(Workout.trainee_id == user_id).all()
    if len(workouts) >= 10:
        achievements.append({
            "title": "🏋️ 10 Workouts",
            "description": "Completed 10 training sessions",
            "achieved": True,
            "date": workouts[9].date.isoformat()
        })
    if len(workouts) >= 25:
        achievements.append({
            "title": "🔥 25 Workouts",
            "description": "Completed 25 training sessions",
            "achieved": True,
            "date": workouts[24].date.isoformat()
        })
    
    return {
        "trainee_id": trainee_id,
        "achievements": achievements,
        "total_unlocked": len([a for a in achievements if a.get('achieved')])
    }


@router.get("/compliance-overview")
def get_compliance_overview(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get trainee compliance for all assigned trainees"""
    if current_user.role == UserRole.TRAINER:
        trainer = get_trainer_profile(db, current_user)
        trainees = db.query(Trainee).filter(Trainee.trainer_id == trainer.id).all()
    else:
        trainees = db.query(Trainee).all()
    
    from app.models import Measurement
    
    compliance_data = []
    for trainee in trainees:
        # Use user_id for Measurement and Workout tables (they reference users.id, not trainees.id)
        user_id = trainee.user_id
        
        measurements = db.query(Measurement).filter(
            Measurement.trainee_id == user_id
        ).count()
        
        workouts = db.query(Workout).filter(
            Workout.trainee_id == user_id
        ).count()
        
        last_measurement = db.query(Measurement).filter(
            Measurement.trainee_id == user_id
        ).order_by(Measurement.created_at.desc()).first()
        
        # Calculate adherence (measurements per expected frequency)
        from datetime import timedelta
        if last_measurement and trainee.user.created_at:
            days_since_join = (datetime.now() - trainee.user.created_at).days or 1
            expected_measurements = max(1, days_since_join // 7)  # Weekly expected
            adherence = min(100, (measurements / expected_measurements) * 100)
        else:
            adherence = 0
        
        compliance_data.append({
            "trainee_id": trainee.id,
            "trainee_name": trainee.user.name,
            "measurements_logged": measurements,
            "workouts_completed": workouts,
            "adherence_rate": round(adherence),
            "last_measurement": last_measurement.created_at.isoformat() if last_measurement else None,
            "status": "Active" if adherence >= 70 else ("At Risk" if adherence >= 40 else "Inactive")
        })
    
    return {
        "compliance_data": sorted(compliance_data, key=lambda x: x['adherence_rate'], reverse=True),
        "average_adherence": round(sum(c['adherence_rate'] for c in compliance_data) / max(1, len(compliance_data)))
    }


# =========================================================
#  TRAINER NOTIFICATIONS
# =========================================================

@router.get("/notifications")
def get_trainer_notifications(
    unread_only: bool = Query(False, description="Filter to only unread notifications"),
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Get notifications for the current trainer"""
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
        print(f"Error fetching trainer notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@router.post("/notifications/{notification_id}/read")
def mark_trainer_notification_read(
    notification_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Mark a notification as read for the current trainer"""
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
def mark_all_trainer_notifications_read(
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the current trainer"""
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
def delete_trainer_notification(
    notification_id: int,
    current_user: User = Depends(require_trainer_or_admin),
    db: Session = Depends(get_db)
):
    """Delete a notification for the current trainer"""
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

