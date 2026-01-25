# FitMate Database Design Document

**Project:** FitMate Fitness Training Management System | **Date:** January 2026 | **Database:** PostgreSQL

---

## Database Overview
FitMate uses a relational PostgreSQL database with 30+ tables organized into 7 core domains. The schema supports multi-role authentication (Admin, Trainer, Trainee), comprehensive workout/nutrition tracking, billing, and gym management.

---

## Core Entity Domains

### 1. **User Management** (Identity & Access)
- **Users**: Core authentication entity with role-based access (ADMIN, TRAINER, TRAINEE)
- **AdminSession**: Session tracking with IP logging, 2FA verification, and activity monitoring
- **AdminOTP**: One-time passwords for 2FA authentication
- **AdminSettings**: System configuration (gym name, timezone, backup settings, notifications)

### 2. **Trainer Management** (Staff & Operations)
- **Trainer**: Profile with certifications, experience, bank details, health info; UUID primary key
- **TrainerSchedule**: Recurring/specific schedules with availability and session types
- **TrainerAttendance**: Daily check-in/out, hours worked, leave tracking
- **TrainerSalary**: Salary configuration (fixed/commission-based with bonuses)
- **TrainerDocument**: Certification, identity documents with verification workflow
- **TrainerLeave**: Leave requests with approval workflow

### 3. **Trainee Management** (Client Profiles)
- **Trainee**: User profile linked to trainer with fitness goals, health conditions, emergency contact
- **Measurement**: Body measurements (weight, body fat, muscle mass, circumferences)
- **ProgressMeasurement**: Historical body metrics tracking
- **Attendance**: Gym check-in/out records with duration tracking

### 4. **Training & Workouts** (Exercise Programs)
- **WorkoutPlan**: Trainer-created plans with JSON schema for exercise details
- **Workout**: Individual session logs with duration, calories, accuracy metrics
- **PTPackage**: Personal training packages with pricing and feature inclusions
- **PTSession**: Scheduled PT sessions with performance metrics and feedback
- **AIReport**: AI-generated workout analysis and recommendations (JSON-based)

### 5. **Nutrition & Wellness** (Diet Tracking)
- **DietPlan**: Personalized diet plans with JSON schema containing meal details
- **NutritionLog**: Daily food intake logs with calorie/macro tracking and confidence scores
- **ProgressPhoto**: Before/after photos for progress visualization

### 6. **Billing & Membership** (Financial Management)
- **Payment**: Transaction records with provider, status, receipt generation, refund tracking
- **Membership**: Active memberships with auto-renewal options
- **MembershipPlan**: Available membership tiers with features and pricing
- **TrainerRevenue**: Earnings tracking per trainer with payout dates
- **Expense**: Gym operational expenses with categorization and bill attachments

### 7. **Communication & Infrastructure**
- **Message**: Global messaging system (Admin↔User) with read status and timestamps
- **TrainerMessage**: Trainer↔Trainee direct messaging
- **Notification**: System notifications with type categorization and read tracking
- **Equipment**: Gym equipment inventory with maintenance scheduling
- **GymScheduleSlot**: Weekly gym operating hours with slot types and capacity limits

---

## Key Design Patterns

| Pattern | Implementation | Example |
|---------|---------------|----|
| **Role-Based Access** | UserRole enum (ADMIN, TRAINER, TRAINEE) | User.role field |
| **UUID for Trainers** | UUID primary key (UUID(as_uuid=True)) | Trainer.id |
| **JSON Storage** | Flexible data in JSON columns | WorkoutPlan.plan_json, AIReport.report_json |
| **Soft Delete** | ondelete="CASCADE" ForeignKeys | User→related entities cleanup |
| **Audit Trail** | created_at, updated_at timestamps | All entities (server_default=func.now()) |
| **Read Status Tracking** | Boolean + timestamp fields | Message.is_read + read_at |

---

## Critical Relationships

```
Users (1) ──────→ (1) Trainer (via trainer_profile)
Users (1) ──────→ (1) Trainee (via trainee_profile)
Trainee (M) ───→ (1) Trainer
User (1) -------→ (M) Workouts, Measurements, Payments, Memberships
Trainer (1) ----→ (M) TrainerSchedule, TrainerAttendance, WorkoutPlan
Trainee (1) ----→ (M) DietPlan, NutritionLog, ProgressMeasurement
```

---

## Indexing Strategy

**Indexed Columns** (Performance Optimization):
- `users.email` (unique, login)
- `users.role` (filtering by role)
- `payments.status`, `payments.created_at` (transaction queries)
- `membership.status`, `membership.membership_type` (active member filtering)
- `is_read` on Messages/Notifications (unread filtering)

---

## Data Integrity Notes
- **Schema Mismatch**: TrainerDocument & TrainerLeave use String(36) FK instead of UUID for trainer_id (relationships disabled)
- **Cascade Behavior**: User deletion cascades to related payment, membership, and measurement records
- **Transaction Types**: Supports refunds with refund_amount, refund_reason, is_refund fields
- **Salary Models**: Supports fixed + commission-based compensation with performance bonuses

---

## Technology Stack
- **DBMS**: PostgreSQL 12+
- **ORM**: SQLAlchemy 2.0 with async support
- **Migrations**: Alembic (11 migration files for schema evolution)
- **Backend**: FastAPI/Python

