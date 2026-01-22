# ==========================
# IMPORTS
# ==========================
from app.database import Base
from sqlalchemy import Time
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from datetime import datetime, date
import enum

from sqlalchemy import (
    Column, Integer, String, Boolean, Float,
    Date, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Enum as SQLEnum

# ==========================
# ENUMS
# ==========================
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    TRAINER = "TRAINER"
    TRAINEE = "TRAINEE"



# ==========================
# USER
# ==========================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)

    role = Column(SQLEnum(UserRole, name="user_role"), default=UserRole.TRAINEE, nullable=False)

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    trainer_profile = relationship("Trainer", back_populates="user", uselist=False)
    trainee_profile = relationship("Trainee", back_populates="user", uselist=False)

    workouts = relationship("Workout", back_populates="trainee")
    measurements = relationship("Measurement", back_populates="trainee")
    nutrition_logs = relationship("NutritionLog", back_populates="trainee")
    memberships = relationship("Membership", back_populates="trainee")
    payments = relationship("Payment", back_populates="trainee")
    workout_plans = relationship("WorkoutPlan", back_populates="trainee")
    diet_plans = relationship("DietPlan", back_populates="trainee")
    attendance_records = relationship("Attendance", back_populates="trainee")
    progress_photos = relationship("ProgressPhoto", back_populates="trainee")
    progress_measurements = relationship("ProgressMeasurement", back_populates="trainee")

    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

    admin_sessions = relationship("AdminSession", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"


# ==========================
# ADMIN SETTINGS
# ==========================
class AdminSettings(Base):
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Gym Information
    gym_name = Column(String(255), default="FitMate Pro Gym")
    email = Column(String(255), default="admin@fitmate.com")
    phone = Column(String(20), default="+1-800-FITMATE")
    address = Column(Text, default="123 Fitness St, City")
    
    # Display & Regional Settings
    theme = Column(String(20), default="dark")
    timezone = Column(String(50), default="UTC")
    currency = Column(String(10), default="USD")
    
    # Notification Settings
    notifications_enabled = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)
    maintenance_reminders = Column(Boolean, default=True)
    schedule_notifications = Column(Boolean, default=True)
    
    # Security Settings
    two_factor_enabled = Column(Boolean, default=False)
    max_failed_logins = Column(Integer, default=5)
    session_timeout_minutes = Column(Integer, default=30)
    
    # Data & Backup Settings
    backup_enabled = Column(Boolean, default=True)
    auto_backup_enabled = Column(Boolean, default=True)
    backup_frequency = Column(String(20), default="daily")
    data_retention_days = Column(Integer, default=365)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")


# ==========================
# TRAINER  (UUID PRIMARY KEY)
# ==========================

# ==========================
# TRAINER  (UUID PRIMARY KEY)
# ==========================

class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Basic info
    specialization = Column(String(200))
    bio = Column(Text)
    rating = Column(Float, default=0.0)
    total_clients = Column(Integer, default=0)
    
    # New fields for trainer creation
    experience_years = Column(Integer, default=0)
    certifications = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Personal details
    aadhar_number = Column(String(20), unique=True, nullable=True)
    pan_number = Column(String(20), unique=True, nullable=True)

    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)

    blood_group = Column(String(10), nullable=True)

    # Address
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)

    # Bank info
    bank_account_number = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    bank_name = Column(String(100), nullable=True)

    # Relationships
    user = relationship("User", back_populates="trainer_profile")
    trainees = relationship("Trainee", back_populates="trainer")
    workout_plans = relationship("WorkoutPlan", back_populates="trainer")
    revenue_records = relationship("TrainerRevenue", back_populates="trainer")
    salary_configs = relationship("TrainerSalary", back_populates="trainer")
    schedules = relationship("TrainerSchedule", back_populates="trainer")
    attendance_records = relationship("TrainerAttendance", back_populates="trainer")
    # documents = relationship("TrainerDocument", back_populates="trainer",cascade="all, delete-orphan")    
    # leaves = relationship("TrainerLeave", back_populates="trainer",cascade="all, delete-orphan")
    # ⚠️ Documents and Leaves relationships disabled due to schema mismatch - using raw SQL for deletion
    
    def __repr__(self):
        return f"<Trainer {self.id}>"

class TrainerAttendance(Base):
    __tablename__ = "trainer_attendance"

    id = Column(Integer, primary_key=True)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)

    date = Column(Date, default=date.today)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)

    status = Column(String(20), default="present")
    hours_worked = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)
    leave_reason = Column(String(200), nullable=True)

    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trainer = relationship("Trainer", back_populates="attendance_records")
    approver = relationship("User")


class TrainerSchedule(Base):
    __tablename__ = "trainer_schedules"

    id = Column(Integer, primary_key=True)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)
    trainee_id = Column(Integer, ForeignKey("trainees.id"), nullable=True)  # Assigned trainee

    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    is_available = Column(Boolean, default=True)
    is_recurring = Column(Boolean, default=True)
    specific_date = Column(Date, nullable=True)
    session_type = Column(String(50), nullable=True)  # personal_training, group, assessment

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trainer = relationship("Trainer", back_populates="schedules")
    trainee = relationship("Trainee", foreign_keys=[trainee_id])

class TrainerSalary(Base):
    __tablename__ = "trainer_salaries"

    id = Column(Integer, primary_key=True)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)

    salary_model = Column(String(20), default="fixed")

    base_salary = Column(Float, default=0)
    commission_per_trainee = Column(Float, nullable=True)
    commission_per_session = Column(Float, nullable=True)

    monthly_bonus = Column(Float, default=0)
    performance_bonus = Column(Float, default=0)

    is_active = Column(Boolean, default=True)
    effective_from = Column(Date, default=date.today)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trainer = relationship("Trainer", back_populates="salary_configs")

class PTPackage(Base):
    __tablename__ = "pt_packages"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)

    sessions_count = Column(Integer, nullable=False)
    duration_days = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    includes_diet_plan = Column(Boolean, default=False)
    includes_supplements = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PTSession(Base):
    __tablename__ = "pt_sessions"

    id = Column(Integer, primary_key=True)

    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("pt_packages.id"))

    session_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)

    status = Column(String(20), default="scheduled")

    exercises_done = Column(Text)
    trainer_notes = Column(Text)
    trainee_feedback = Column(Text)

    calories_burned = Column(Integer)
    performance_rating = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TrainerDocument(Base):
    __tablename__ = "trainer_documents"

    id = Column(Integer, primary_key=True)
    trainer_id = Column(String(36), ForeignKey("trainers.id"), nullable=False)

    document_type = Column(String(50), nullable=False)
    document_name = Column(String(200), nullable=False)

    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    mime_type = Column(String(100))

    description = Column(Text)
    expiry_date = Column(Date)

    is_verified = Column(Boolean, default=False)
    verified_by = Column(Integer, ForeignKey("users.id"))
    verified_at = Column(DateTime)

    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # trainer = relationship("Trainer", back_populates="documents")  # Disabled due to schema mismatch
    verifier = relationship("User", foreign_keys=[verified_by])



class TrainerLeave(Base):
    __tablename__ = "trainer_leaves"

    id = Column(Integer, primary_key=True)
    trainer_id = Column(String(36), ForeignKey("trainers.id"), nullable=False)

    leave_type = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending")

    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # trainer = relationship("Trainer", back_populates="leaves")  # Disabled due to schema mismatch

    # Approver
    approver = relationship("User", foreign_keys=[approved_by])

# ==========================
# TRAINEE
# ==========================

class Trainee(Base):
    __tablename__ = "trainees"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # trainer_id must match Trainer.id (UUID)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"))

    # Fitness info
    goal = Column(String(100))
    weight = Column(Float)
    height = Column(Float)
    target_weight = Column(Float)
    fitness_level = Column(String(50), default="beginner")
    fitness_goals = Column(Text, nullable=True)  # Detailed fitness goals
    
    # Personal info
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    
    # Emergency contact
    emergency_contact_name = Column(String(100), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
    
    # Health info
    health_conditions = Column(Text, nullable=True)  # Medical conditions, allergies, injuries

    user = relationship("User", back_populates="trainee_profile")
    trainer = relationship("Trainer", back_populates="trainees")

    def __repr__(self):
        return f"<Trainee {self.id}>"


# ==========================
# ADMIN SESSION
# ==========================

class AdminSession(Base):
    __tablename__ = "admin_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(50), nullable=False)
    user_agent = Column(String(500), nullable=True)

    login_time = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    requires_2fa = Column(Boolean, default=False)
    two_factor_verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="admin_sessions")

    def __repr__(self):
        return f"<AdminSession {self.id}>"


# ==========================
# WORKOUT
# ==========================

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True)
    trainee_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    exercise_type = Column(String(100))
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)

    total_reps = Column(Integer, default=0)
    calories_burned = Column(Float, default=0)
    avg_accuracy = Column(Float)
    summary_json = Column(JSON)

    trainee = relationship("User", back_populates="workouts")
    ai_reports = relationship("AIReport", back_populates="workout")

    def __repr__(self):
        return f"<Workout {self.id}>"


# ==========================
# AI REPORT
# ==========================

# ==========================
# AI REPORT
# ==========================

class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(Integer, primary_key=True, index=True)

    trainee_id = Column(Integer, ForeignKey("trainees.id"), nullable=False)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=True)

    report_type = Column(String(50), nullable=False)
    report_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("Trainee")
    workout = relationship("Workout", back_populates="ai_reports")

    def __repr__(self):
        return f"<AIReport {self.id}>"



# ==========================
# MEASUREMENT
# ==========================

class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())

    weight = Column(Float)
    body_fat = Column(Float)
    muscle_mass = Column(Float)
    chest = Column(Float)
    waist = Column(Float)
    hips = Column(Float)
    biceps = Column(Float)

    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("User", back_populates="measurements")

    def __repr__(self):
        return f"<Measurement {self.id}>"


# ==========================
# DIET PLAN
# ==========================

class DietPlan(Base):
    __tablename__ = "diet_plans"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_json = Column(JSON, nullable=False)
    start_date = Column(DateTime(timezone=True), server_default=func.now())
    end_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("User", back_populates="diet_plans")

    def __repr__(self):
        return f"<DietPlan {self.id}>"


# ==========================
# NUTRITION LOG
# ==========================

class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    item = Column(String(200), nullable=False)
    calories = Column(Float, nullable=False)
    macros_json = Column(JSON)
    image_url = Column(String(500))
    confidence = Column(Float, default=0.0)
    notes = Column(String(500), nullable=True)  # Added notes field
    meal_type = Column(String(50), nullable=True, default="other")  # breakfast, lunch, dinner, snack, other
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("User", back_populates="nutrition_logs")

    def __repr__(self):
        return f"<NutritionLog {self.id}>"


# ==========================
# PAYMENT
# ==========================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    provider = Column(String(50), nullable=False)
    status = Column(String(20), default="pending", index=True)
    transaction_id = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    trainee = relationship("User", back_populates="payments")
    receipt_number = Column(String, unique=True, index=True, nullable=True)
    payment_mode = Column(String, nullable=True)  # cash / upi / card
    receipt_pdf_url = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    is_refund = Column(Boolean, default=False)
    refund_amount = Column(Float, nullable=True)
    refund_reason = Column(String, nullable=True)
    def __repr__(self):
        return f"<Payment {self.id}>"


# ==========================
# MEMBERSHIP
# ==========================

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    membership_type = Column(String(50), nullable=False, index=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="active", index=True)
    price = Column(Float, nullable=False)
    auto_renew = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("User", back_populates="memberships")

    def __repr__(self):
        return f"<Membership {self.id}>"


# ==========================
# WORKOUT PLAN
# ==========================

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"

    id = Column(Integer, primary_key=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"))

    plan_name = Column(String(200))
    plan_json = Column(JSON)

    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    trainee = relationship("User", back_populates="workout_plans")
    trainer = relationship("Trainer", back_populates="workout_plans")

    def __repr__(self):
        return f"<WorkoutPlan {self.id}>"


# ==========================
# ATTENDANCE
# ==========================

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    check_out_time = Column(DateTime(timezone=True))
    duration_minutes = Column(Integer)
    check_in_method = Column(String(50), default="manual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("User", back_populates="attendance_records")

    def __repr__(self):
        return f"<Attendance {self.id}>"


# ==========================
# EQUIPMENT
# ==========================

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    condition = Column(String(50), default="good")
    status = Column(String(50), default="operational")
    location = Column(String(200))
    last_maintenance = Column(DateTime(timezone=True))
    next_maintenance = Column(DateTime(timezone=True))
    maintenance_notes = Column(Text)
    serial_number = Column(String(100))
    purchase_date = Column(DateTime(timezone=True))
    warranty_expiry = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Equipment {self.id}>"


# ==========================
# GYM SCHEDULE SLOT
# ==========================

class GymScheduleSlot(Base):
    __tablename__ = "gym_schedule_slots"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(20), nullable=False)  # Monday, Tuesday, etc.
    start_time = Column(String(20), nullable=False)   # "6:00 AM"
    end_time = Column(String(20), nullable=False)     # "10:00 AM"
    slot_type = Column(String(50), default="general")  # general, class, personal_training
    title = Column(String(200))                        # e.g., "Morning Session", "Yoga Class"
    description = Column(Text)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=True)
    max_capacity = Column(Integer, default=0)          # 0 = unlimited
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    trainer = relationship("Trainer")

    def __repr__(self):
        return f"<GymScheduleSlot {self.id}>"


# ==========================
# MEMBERSHIP PLAN
# ==========================

class MembershipPlan(Base):
    __tablename__ = "membership_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    membership_type = Column(String(50), nullable=False)
    price = Column(Float, nullable=False)
    duration_months = Column(Integer, nullable=False)
    features = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<MembershipPlan {self.id}>"


# ==========================
# PROGRESS PHOTO
# ==========================

class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    photo_type = Column(String(50), nullable=False)
    image_url = Column(String(500), nullable=False)
    date_taken = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("User", back_populates="progress_photos")

    def __repr__(self):
        return f"<ProgressPhoto {self.id}>"


# ==========================
# MESSAGE
# ==========================

# ==========================
# TRAINER ↔ TRAINEE MESSAGE
# ==========================

class TrainerMessage(Base):
    __tablename__ = "trainer_messages"

    id = Column(Integer, primary_key=True, index=True)

    trainee_id = Column(Integer, ForeignKey("trainees.id"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=True)

    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trainee = relationship("Trainee")
    trainer = relationship("Trainer")
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def __repr__(self):
        return f"<TrainerMessage {self.id}>"



# ==========================
# TRAINER REVENUE (UUID FK)
# ==========================

class TrainerRevenue(Base):
    __tablename__ = "trainer_revenue"

    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"))
    amount = Column(Float)
    source = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, default=datetime.utcnow)  # Added field for payout date

    trainer = relationship("Trainer", back_populates="revenue_records")

    def __repr__(self):
        return f"<TrainerRevenue {self.id}>"


# ==========================
# PROGRESS MEASUREMENT
# ==========================

class ProgressMeasurement(Base):
    __tablename__ = "progress_measurements"

    id = Column(Integer, primary_key=True, index=True)
    trainee_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date, default=date.today)

    weight = Column(Float)
    body_fat = Column(Float)
    muscle_mass = Column(Float)
    chest = Column(Float)
    waist = Column(Float)
    hips = Column(Float)
    biceps = Column(Float)

    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    trainee = relationship("User", back_populates="progress_measurements")

    def __repr__(self):
        return f"<ProgressMeasurement {self.id}>"


# ==========================
# ADMIN OTP
# ==========================

class AdminOTP(Base):
    __tablename__ = "admin_otp"

    id = Column(Integer, primary_key=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    otp = Column(String(6))
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AdminOTP {self.id}>"

# ==========================
# GLOBAL MESSAGE  (Admin messaging)
# ==========================

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)  # Timestamp when message was marked as read
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

    def __repr__(self):
        return f"<Message {self.id}>"

# ==========================
# NOTIFICATION
# ==========================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="general")  # schedule, equipment, system, etc.
    
    is_read = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User")

    def __repr__(self):
        return f"<Notification {self.id}>"


class Expense(Base):
  __tablename__ = "expenses"

  id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
  category = Column(String, nullable=False)
  amount = Column(Float, nullable=False)
  date = Column(Date, nullable=False)
  paid_to = Column(String, nullable=True)
  mode = Column(String, nullable=True)  # cash / upi / card / bank
  notes = Column(String, nullable=True)
  bill_url = Column(String, nullable=True)
