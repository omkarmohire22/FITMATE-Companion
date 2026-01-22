from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID  # ✅ ADD THIS IMPORT
from app.models import UserRole
from pydantic import BaseModel
from datetime import date
from datetime import time
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.TRAINEE

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        import re
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        # Optionally enforce special character:
        # if not re.search(r'[^A-Za-z0-9]', v):
        #     raise ValueError('Password must contain at least one special character')
        return v


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError('Phone must contain only digits')
        if not 10 <= len(v) <= 15:
            raise ValueError('Phone must be 10 to 15 digits')
        return v

    @model_validator(mode="after")
    def at_least_one_identifier(self):
        if not (self.username or self.email or self.phone):
            raise ValueError('Either username, email, or phone is required')
        return self

class CreateTrainerRequest(BaseModel):
    user_id: int
    specialization: Optional[str]
    bio: Optional[str]
    aadhar_number: Optional[str]
    pan_number: Optional[str]
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    blood_group: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]
    bank_account_number: Optional[str]
    ifsc_code: Optional[str]
    bank_name: Optional[str]


class UpdateTrainerRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    certifications: Optional[str] = None

class AssignTraineeRequest(BaseModel):
    trainee_id: int
    trainer_id: str

class TrainerAttendanceRequest(BaseModel):
    trainer_id: str
    check_in: datetime
    check_out: Optional[datetime] = None
    status: str = "present"  # present, late, absent, leave

class UpdateSalaryRequest(BaseModel):
    salary_model: str
    salary_amount: Optional[float] = None
    commission_rate: Optional[float] = None
    base_salary: Optional[float] = None

class TrainerScheduleRequest(BaseModel):
    trainer_id: Optional[str] = None
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    is_available: bool = True

class TraineeAttendanceMarkRequest(BaseModel):
    status: str  # present, absent
    date: Optional[date] = None

class TraineeScheduleAssignRequest(BaseModel):
    trainee_id: int
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: time
    end_time: time
    session_type: str = "personal_training"  # personal_training, group, assessment
    notes: Optional[str] = None
    send_notification: bool = True

class PTPackageRequest(BaseModel):
    name: str
    sessions_count: int
    price: float
    duration_days: int
    description: Optional[str] = None

class PTSessionRequest(BaseModel):
    trainer_id: str
    trainee_id: int
    package_id: int
    session_date: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None

class TrainerLoginRequest(BaseModel):
    trainer_id: int
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        import re
        v = v.strip()
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        # Optionally enforce special character:
        # if not re.search(r'[^A-Za-z0-9]', v):
        #     raise ValueError('Password must contain at least one special character')
        return v


class TrainerUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    certifications: Optional[str] = None
    bio: Optional[str] = None
    salary_model: Optional[str] = None
    base_salary: Optional[float] = None
    commission_per_session: Optional[float] = None


class WorkoutCreate(BaseModel):
    exercise_type: Optional[str] = None


class WorkoutUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_reps: Optional[int] = None
    calories_burned: Optional[float] = None
    avg_accuracy: Optional[float] = None
    summary_json: Optional[Dict[str, Any]] = None


class ManualWorkoutCreate(BaseModel):
    exercise_type: str
    duration_minutes: int
    total_reps: Optional[int] = 0
    calories_burned: Optional[float] = 0
    notes: Optional[str] = None


class WorkoutResponse(BaseModel):
    id: int
    trainee_id: int
    exercise_type: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    total_reps: int
    calories_burned: float
    avg_accuracy: Optional[float]
    summary_json: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class AIReportCreate(BaseModel):
    workout_id: int
    report_type: str
    report_json: Dict[str, Any]


class MeasurementCreate(BaseModel):
    weight: Optional[float] = None
    body_fat: Optional[float] = None
    muscle_mass: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    biceps: Optional[float] = None
    notes: Optional[str] = None


class NutritionLogCreate(BaseModel):
    item: str
    calories: float
    macros_json: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None


class ChatQuery(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: UserRole = UserRole.TRAINEE


class MembershipCreate(BaseModel):
    membership_type: str
    start_date: datetime
    end_date: datetime
    price: float
    auto_renew: bool = False


class MembershipResponse(BaseModel):
    id: int
    trainee_id: int
    membership_type: str
    start_date: datetime
    end_date: datetime
    status: str
    price: float
    auto_renew: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MembershipBillingUpdate(BaseModel):
    amount_paid: float
    payment_status: str
    payment_id: Optional[int] = None
    renewal_due_date: Optional[datetime] = None


class WorkoutPlanCreate(BaseModel):
    plan_name: str
    plan_json: Dict[str, Any]
    start_date: datetime
    end_date: Optional[datetime] = None


class WorkoutPlanResponse(BaseModel):
    id: int
    trainee_id: int
    trainer_id: Optional[int]
    plan_name: str
    plan_json: Dict[str, Any]
    start_date: datetime
    end_date: Optional[datetime]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    check_in_method: str = "manual"


class AttendanceResponse(BaseModel):
    id: int
    trainee_id: int
    check_in_time: datetime
    check_out_time: Optional[datetime]
    duration_minutes: Optional[int]
    check_in_method: str
    created_at: datetime

    class Config:
        from_attributes = True


class EquipmentCreate(BaseModel):
    name: str
    type: str
    quantity: int
    condition: str


class EquipmentResponse(BaseModel):
    id: int
    name: str
    type: str
    quantity: int
    condition: str
    status: str
    location: Optional[str]
    last_maintenance: Optional[datetime]
    next_maintenance: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ProgressPhotoCreate(BaseModel):
    photo_type: str
    image_url: str
    notes: Optional[str] = None


class ProgressPhotoResponse(BaseModel):
    id: int
    trainee_id: int
    photo_type: str
    image_url: str
    date_taken: datetime
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ✅ Enhanced Trainee/Member Creation Request
class MemberManagementRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: Optional[str] = None  # If not provided, auto-generate
    trainer_id: Optional[UUID] = None
    membership_plan_id: Optional[int] = None  # Link to membership plan

    # Personal Information
    date_of_birth: Optional[str] = None  # Format: YYYY-MM-DD
    gender: Optional[str] = None  # Male, Female, Other
    address: Optional[str] = None

    # Emergency Contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

    # Health & Fitness

    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v

    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v):
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError('Phone must contain only digits')
        if not 10 <= len(v) <= 15:
            raise ValueError('Phone must be 10 to 15 digits')
        return v

    @field_validator('emergency_contact_phone')
    @classmethod
    def validate_emergency_phone(cls, v):
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError('Emergency contact phone must contain only digits')
        if not 10 <= len(v) <= 15:
            raise ValueError('Emergency contact phone must be 10 to 15 digits')
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_dob(cls, v):
        if v is None:
            return v
        try:
            from datetime import datetime
            datetime.strptime(v, '%Y-%m-%d')
        except Exception:
            raise ValueError('date_of_birth must be in YYYY-MM-DD format')
        return v
    health_conditions: Optional[str] = None  # Allergies, injuries, medical conditions
    fitness_goals: Optional[str] = None  # Weight loss, muscle gain, general fitness
    
    # Legacy field for compatibility
    membership_type: Optional[str] = None


class MemberResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    role: str
    is_active: bool
    trainer_name: Optional[str]
    membership_status: Optional[str]
    membership_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class NutritionLogResponse(BaseModel):
    id: int
    trainee_id: int
    date: datetime
    item: str
    calories: float
    macros_json: Optional[Dict[str, Any]]
    image_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    receiver_id: int
    message: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ==============================
# BILLING & FINANCE SCHEMAS
# ==============================

class RefundPaymentRequest(BaseModel):
    payment_id: int
    refund_amount: float
    refund_reason: str

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    notes: str | None = None
    spent_on: date
    
class PaymentCreate(BaseModel):
    trainee_id: int
    membership_plan_id: int
    payment_mode: str
    amount: float
    notes: Optional[str] = None

