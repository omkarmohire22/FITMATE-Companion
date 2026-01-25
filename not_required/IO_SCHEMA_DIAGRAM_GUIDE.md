# Input/Output Schema Diagram Guide for FitMate Project

## What is an Input/Output Schema Diagram?
An input/output (I/O) schema diagram visually represents:
- **Inputs:** Data your API endpoints/functions receive (request body, query params, headers, etc.)
- **Outputs:** Data they return (response body, status codes, etc.)
- **Data Models:** Structure of the data (fields, types, relationships)

---

## How to Make an I/O Schema Diagram

### 1. Identify Endpoints or Functions
- Look at FastAPI routers (e.g., `backend/app/routers/auth.py`, `trainee.py`, etc.)
- Pick an endpoint, e.g., `/login` or `/trainee/profile`

### 2. Find the Input Schema
- Check the Pydantic model used for the request body (e.g., `LoginRequest`, `TraineeProfileUpdate`)
- List the fields and their types

**Example:**
```python
class LoginRequest(BaseModel):
    email: str
    password: str
```
**Diagram:**
```
Input: LoginRequest
 ├─ email: string
 └─ password: string
```

### 3. Find the Output Schema
- Check the response model (e.g., `TokenResponse`, `TraineeProfile`)
- List the fields and their types

**Example:**
```python
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
```
**Diagram:**
```
Output: TokenResponse
 ├─ access_token: string
 ├─ refresh_token: string
 └─ token_type: string ("bearer")
```

### 4. Draw the Flow
- Show the endpoint, input, and output.
- Use boxes/arrows or a simple tree structure.

**Example for `/login` endpoint:**
```
[Client] --(LoginRequest)--> [POST /login] --(TokenResponse)--> [Client]
```
Or as a box diagram:
```
+-------------------+         +-------------------+         +-------------------+
|   LoginRequest    | ---->   |   /login (POST)   | ---->   |   TokenResponse   |
+-------------------+         +-------------------+         +-------------------+
| email: string     |                                         | access_token: str|
| password: string  |                                         | refresh_token: str|
+-------------------+                                         | token_type: str  |
                                                              +-------------------+
```

---

## Example: Trainee Profile Update

**Input Model:**
```python
class TraineeProfileUpdate(BaseModel):
    name: str
    email: str
    age: int
    # ...other fields
```
**Output Model:**
```python
class TraineeProfile(BaseModel):
    id: int
    name: str
    email: str
    # ...other fields
```
**Diagram:**
```
[Client] --(TraineeProfileUpdate)--> [PUT /trainee/profile] --(TraineeProfile)--> [Client]
```

---

## Tips for Your Project
- Use your Pydantic models in `schemas.py` for accurate field names/types.
- For each endpoint, repeat the process: what does it accept, what does it return?
- For complex/nested models, show the nesting in your diagram.
- Tools: You can draw these diagrams in draw.io, Lucidchart, or even Markdown/ASCII as above.

---

## Summary
- **Input schema:** What the API expects (fields/types)
- **Output schema:** What the API returns (fields/types)
- **Diagram:** Show the flow from client → endpoint → response, with model details

---

If you want a diagram for a specific endpoint or want a visual (draw.io) template, let me know which endpoint or model you want to see!

---

# Actual Input/Output Schemas for FitMate Project

Below are real input/output schemas for 3 key API operations in your project, based on your actual Pydantic models in `backend/app/schemas.py`.

## 1. User Login

**Endpoint:** `POST /auth/login`

### Input Schema: `LoginRequest`
```
LoginRequest
 ├─ username: string | null
 ├─ email: string (email) | null
 ├─ phone: string | null
 └─ password: string
```
- At least one of username, email, or phone is required.

### Output Schema: `TokenResponse`
```
TokenResponse
 ├─ access_token: string
 ├─ refresh_token: string
 ├─ token_type: string ("bearer")
 └─ user: UserResponse
      ├─ id: int
      ├─ email: string (email)
      ├─ name: string
      ├─ phone: string | null
      ├─ role: UserRole
      ├─ is_active: bool
      ├─ is_verified: bool
      └─ created_at: datetime
```

---

## 2. Create Trainer

**Endpoint:** `POST /trainer/create`

### Input Schema: `CreateTrainerRequest`
```
CreateTrainerRequest
 ├─ user_id: int
 ├─ specialization: string | null
 ├─ bio: string | null
 ├─ aadhar_number: string | null
 ├─ pan_number: string | null
 ├─ emergency_contact_name: string | null
 ├─ emergency_contact_phone: string | null
 ├─ blood_group: string | null
 ├─ address: string | null
 ├─ city: string | null
 ├─ state: string | null
 ├─ pincode: string | null
 ├─ bank_account_number: string | null
 ├─ ifsc_code: string | null
 └─ bank_name: string | null
```

### Output Schema: (Typically a Trainer or UserResponse, not shown in full here)

---

## 3. Mark Trainee Attendance

**Endpoint:** `POST /trainee/attendance/mark`

### Input Schema: `TraineeAttendanceMarkRequest`
```
TraineeAttendanceMarkRequest
 ├─ status: string  # present, absent
 └─ date: date | null
```

### Output Schema: (Typically a status message or attendance record)

---

For more endpoints, repeat this process using the models in `schemas.py`.