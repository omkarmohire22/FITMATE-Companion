# FitMate: Data Flow & Storage Architecture

**Last Updated:** January 22, 2026

---

## 1. Data Storage Overview

### **Primary Storage: PostgreSQL Database**
- **Location**: Cloud or local PostgreSQL server (configured via `DATABASE_URL` in `.env`)
- **Connection Pool**: SQLAlchemy with connection pooling (pool_pre_ping, 30-min recycle)
- **ORM**: SQLAlchemy 2.0 for object-relational mapping
- **Migrations**: Alembic manages schema versioning

### **Secondary Storage: File System**
- **Location**: `./profile_uploads/` directory on backend server
- **Contains**: Avatar images, progress photos, nutrition images
- **File Naming**: `user_{user_id}_{filename}`
- **Reference**: URLs stored in database (e.g., `ProgressPhoto.image_url`)

---

## 2. Data Entry Points & API Flow

### **Authentication Flow**
```
User → Frontend (Login Form)
    ↓
POST /api/auth/login (email, password)
    ↓
Backend: Verify credentials against User table
    ↓
Generate JWT Token + Create AdminSession (if admin)
    ↓
Return token to frontend (stored in browser/localStorage)
```

### **Trainee Data Creation**
```
Frontend Trainee Registration → POST /api/auth/register
                                   ↓
                        Creates User record
                                   ↓
                        Creates Trainee record (extended profile)
                                   ↓
Fields stored:
  - User table: email, password_hash, name, phone, role, created_at
  - Trainee table: goal, weight, height, fitness_level, trainer_id, health_conditions
```

### **Trainer Data Creation**
```
Admin/Manual Create → POST /api/trainer/create
                          ↓
                Creates User record (role=TRAINER)
                          ↓
                Creates Trainer record with:
                  - specialization, bio, certifications
                  - bank details (IFSC, account number)
                  - personal info (Aadhar, PAN)
                  - emergency contact
                          ↓
                UUID generated (Trainer.id is UUID, not Integer)
```

---

## 3. Where Each Type of Data Is Saved

### **User/Authentication Data**
| Data Type | Table | Key Fields | Persistence |
|-----------|-------|-----------|-------------|
| Login Credentials | `users` | email, password_hash, role | PostgreSQL |
| 2FA Tokens | `admin_otp` | otp, expires_at | PostgreSQL |
| Session Tracking | `admin_sessions` | ip_address, login_time, 2fa_verified | PostgreSQL |

### **Trainee Data**
| Data | Table | Storage | Example |
|------|-------|---------|---------|
| Profile Info | `trainees` | PostgreSQL | weight, fitness_level, trainer_id |
| Body Measurements | `measurements` | PostgreSQL | chest, waist, hips, body_fat |
| Progress Photos | `progress_photos` | PostgreSQL (URL) + File System (image) | `/profile_uploads/user_5_progress.jpg` |
| Workout History | `workouts` | PostgreSQL + JSON | exercise_type, calories_burned, duration |
| Nutrition Logs | `nutrition_logs` | PostgreSQL (JSON) + File System (food images) | item, calories, macros_json, image_url |
| Attendance | `attendance` | PostgreSQL | check_in_time, check_out_time, duration |
| Memberships | `memberships` | PostgreSQL | membership_type, price, start_date, end_date |

**Example: Trainee Profile Fetch**
```python
GET /api/trainee/profile
    ↓
Queries User table + Trainee table + joined relationships
    ↓
Returns: {
    "id": 1,
    "email": "john@fitmate.com",
    "name": "John",
    "role": "TRAINEE",
    "weight": 75.5,
    "fitness_level": "intermediate",
    "trainer_id": "uuid-1234...",
    "health_conditions": "None"
}
```

### **Trainer Data**
| Data | Table | Storage | Details |
|------|-------|---------|---------|
| Profile & Credentials | `trainers` | PostgreSQL | specialization, certifications, rating |
| Bank Information | `trainers` | PostgreSQL | bank_account_number, ifsc_code (encrypted recommended) |
| Schedule/Availability | `trainer_schedules` | PostgreSQL | day_of_week, start_time, end_time, is_available |
| Attendance | `trainer_attendance` | PostgreSQL | check_in, check_out, hours_worked, status |
| Salary Config | `trainer_salaries` | PostgreSQL | base_salary, commission_per_trainee, bonuses |
| Documents | `trainer_documents` | PostgreSQL (metadata) + File System (PDF) | certifications, documents.is_verified |
| Revenue/Payouts | `trainer_revenue` | PostgreSQL | amount, source, paid_at |

**Example: Trainer Data Creation**
```python
POST /api/trainer/create
Body: {
    "user_id": 1,
    "specialization": "Strength Training",
    "experience_years": 5,
    "certifications": "ACE, NASM",
    "bank_account": "123456789",
    "ifsc_code": "ICIC0000001"
}
    ↓
Creates Trainer record with:
- id = UUID (auto-generated)
- user_id = 1 (FK to users table)
- All other fields stored as is
```

### **Workout & Fitness Data**
| Data | Table | Format | Storage |
|------|-------|--------|---------|
| Workout Sessions | `workouts` | JSON summary | PostgreSQL |
| Exercise Details | `workouts.summary_json` | JSON | {"sets": [...], "reps": [...]} |
| AI Analysis | `ai_reports` | JSON | report_json with ML insights |
| Workout Plans | `workout_plans` | JSON schema | plan_json with exercise sequence |
| PT Sessions | `pt_sessions` | Structured | trainer_notes, performance_rating |

### **Nutrition Data**
| Data | Table | Storage | Details |
|------|-------|---------|---------|
| Food Logs | `nutrition_logs` | PostgreSQL | item, calories, macros_json |
| Food Images | `nutrition_logs.image_url` | File System | `/profile_uploads/nutrition_*.jpg` |
| Diet Plans | `diet_plans` | PostgreSQL (JSON) | Meal schedule with macros |
| Confidence Scores | `nutrition_logs.confidence` | PostgreSQL | AI confidence (0-1) for food recognition |

### **Billing & Financial Data**
| Data | Table | Storage | Security |
|------|-------|---------|----------|
| Payments | `payments` | PostgreSQL | amount, status, transaction_id, receipt_pdf_url |
| Refunds | `payments` | PostgreSQL | is_refund, refund_amount, refund_reason |
| Memberships | `memberships` | PostgreSQL | price, start_date, auto_renew flag |
| PT Packages | `pt_packages` | PostgreSQL | sessions_count, duration_days, price |
| Expenses | `expenses` | PostgreSQL | category, amount, bill_url (file reference) |
| Trainer Revenue | `trainer_revenue` | PostgreSQL | amount, source, paid_at |

### **Communication Data**
| Data | Table | Storage | Features |
|------|-------|---------|----------|
| Messages (Admin) | `messages` | PostgreSQL | sender_id, receiver_id, is_read, read_at timestamp |
| Trainer Messages | `trainer_messages` | PostgreSQL | trainee_id, trainer_id, message, created_at |
| Notifications | `notifications` | PostgreSQL | user_id, title, notification_type, is_read |

---

## 4. Backend API Architecture

### **Request Flow**
```
Frontend (React/Vite)
    ↓ (HTTP/CORS allowed: localhost:3000, 3003, 3004, 5173)
FastAPI App (main.py)
    ↓
Router Selection (auth, trainer, trainee, billing, etc.)
    ↓
Authentication Check (JWT token verification)
    ↓
Database Query (SQLAlchemy ORM)
    ↓
PostgreSQL Database
    ↓
Return JSON Response + UUID encoding (custom JSONEncoder)
```

### **Key API Endpoints**

**Authentication**
- `POST /api/auth/register` - Create trainee/trainer account
- `POST /api/auth/login` - Generate JWT token
- `POST /api/auth/logout` - Invalidate session

**Trainee Operations**
- `GET /api/trainee/profile` - Fetch trainee info
- `POST /api/trainee/update-profile` - Update profile
- `GET /api/trainee/workouts` - List workout history
- `POST /api/trainee/nutrition-log` - Log food intake
- `GET /api/trainee/measurements` - Body metrics
- `POST /api/trainee/upload-progress-photo` - Store progress images

**Trainer Operations**
- `GET /api/trainer/dashboard` - Trainer metrics
- `GET /api/trainer/trainees` - List assigned trainees
- `POST /api/trainer/assign-trainee` - Add trainee to trainer
- `POST /api/trainer/mark-attendance` - Check in/out
- `GET /api/trainer/schedule` - View availability
- `POST /api/trainer/revenue` - Track earnings

**Admin Operations**
- `GET /api/admin/trainers` - Manage trainers
- `POST /api/admin/create-trainer` - Create trainer account
- `GET /api/admin/trainees` - View all trainees
- `GET /api/admin/payments` - Revenue reports
- `POST /api/admin/settings` - Update gym settings

---

## 5. Data Validation & Processing

### **Schema Validation (Pydantic)**
```python
# Request validation (schemas.py)
class UserCreate(BaseModel):
    email: EmailStr              # Must be valid email
    password: str                # Min 8 chars, uppercase, number
    name: str
    role: UserRole = TRAINEE

# Response serialization
class UserResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    created_at: datetime
    config = {"from_attributes": True}  # ORM mode
```

### **Database Constraints**
- **Unique**: email, phone (indexed for performance)
- **Foreign Keys**: Ensure referential integrity (CASCADE on user delete)
- **UUID Validation**: Trainer.id must be UUID format
- **Enum Types**: UserRole (ADMIN, TRAINER, TRAINEE)

---

## 6. File Upload Handling

### **Profile/Nutrition Images**
```
Frontend (Trainee uploads food photo)
    ↓
POST /api/trainee/nutrition-log (FormData + UploadFile)
    ↓
Backend validation (file size, type)
    ↓
Save: ./profile_uploads/user_5_IMG_1234.jpg
    ↓
Store in database:
    nutrition_logs.image_url = "/profile_uploads/user_5_IMG_1234.jpg"
    ↓
Return: {"image_url": "...", "nutrition_log_id": 42}
```

### **Directories Used**
```
backend/
├── profile_uploads/          ← Profile pictures, food images, progress photos
├── fitmate.db               ← SQLite fallback (if not using PostgreSQL)
└── alembic/versions/        ← Database migration history
```

---

## 7. Data Relationships & Query Examples

### **Get All Trainee's Data**
```python
trainee = db.query(User).filter(User.id == 5).first()
# Automatically loads:
# - trainee.trainee_profile → Trainee record
# - trainee.trainee_profile.trainer → Assigned Trainer
# - trainee.workouts → All Workout records
# - trainee.measurements → All body measurements
# - trainee.nutrition_logs → All food logs
# - trainee.memberships → Active memberships
# - trainee.payments → All transactions
```

### **Get Trainer's Assigned Trainees**
```python
trainer = db.query(Trainer).filter(Trainer.id == uuid).first()
trainees = trainer.trainees  # All Trainee objects
# Also has:
# - trainer.schedules → Availability
# - trainer.attendance_records → Check-in history
# - trainer.revenue_records → Payment tracking
# - trainer.salary_configs → Compensation setup
```

---

## 8. Environment Configuration (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fitmate_db

# File Storage
PROFILE_UPLOAD_DIR=./profile_uploads

# Security
SECRET_KEY=your-jwt-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 9. Data Summary

| Aspect | Location | Type |
|--------|----------|------|
| **User Accounts** | PostgreSQL `users` table | Structured SQL |
| **Trainee Profiles** | PostgreSQL `trainees` table | Structured SQL |
| **Trainer Profiles** | PostgreSQL `trainers` table (UUID PK) | Structured SQL |
| **Workout Logs** | PostgreSQL `workouts` + `ai_reports` | SQL + JSON |
| **Nutrition Logs** | PostgreSQL `nutrition_logs` + File System | SQL + Images |
| **Photos** | File System: `./profile_uploads/` | JPEG/PNG files |
| **Financial Data** | PostgreSQL `payments`, `memberships`, `expenses` | Structured SQL |
| **Session Tracking** | PostgreSQL `admin_sessions`, `trainer_attendance` | Audit logs |
| **Messages** | PostgreSQL `messages`, `trainer_messages` | Structured SQL |

---

## 10. Data Flow Diagram

```
Frontend (React)
     ↓
[JWT Token in Headers]
     ↓
FastAPI Router
     ↓
Authentication Middleware (get_current_user)
     ↓
Database Connection (SessionLocal)
     ↓
SQLAlchemy Query
     ↓
PostgreSQL ← → File System (images)
     ↓
Response Serialization (Pydantic)
     ↓
JSON Response to Frontend
```

---

**Key Takeaway**: All structured data (user info, workouts, meals, payments) is saved in **PostgreSQL**, while binary files (images, documents) are saved on the **file system** with references stored in the database.

