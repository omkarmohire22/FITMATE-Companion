
# 🏋️ FitMate – Smart Gym Management Companion

## 📌 Overview

FitMate is a web-based **Smart Gym Management Companion** designed to help gyms manage trainees, trainers, and daily fitness activities in a structured and efficient manner. The platform provides role-based dashboards for Admin, Trainer, and Trainee, along with manual fitness tracking and an AI chatbot for workout and health guidance.

---

## 🚀 Features

### Core Features

* **Role-Based Access System**

  * Admin Dashboard
  * Trainer Dashboard
  * Trainee Dashboard

* **Gym Management**

  * Add & manage trainers and trainees (Admin only)
  * Membership plans & billing records
  * Equipment and schedule management

* **Fitness Tracking**

  * Attendance marking
  * Diet logging
  * Progress tracking (weight, remarks, history)
  * Visual progress dashboards

* **Communication**

  * Messaging between Admin, Trainer, and Trainee
  * Feedback system

* **AI Chatbot**

  * Fitness, workout, and diet-related assistance
  * Acts as a virtual fitness guide

* **Secure Authentication**

  * Email & password login
  * Role-based authorization

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* Recharts (for analytics & charts)
* Axios

### Backend

* FastAPI / Flask (Python)
* PostgreSQL
* JWT Authentication
* SQLAlchemy ORM

### AI Integration

* OpenAI API (AI Chatbot)

---

## 📁 Project Structure

```
FitMate/
├── frontend/          # React frontend
├── backend/           # FastAPI / Flask backend
├── database/          # PostgreSQL schema
├── diagrams/          # UML & DFD diagrams
└── README.md
```

---

## 🔐 Authentication & Security

* Role-based access control (Admin, Trainer, Trainee)
* Secure JWT-based authentication
* Restricted system access (Admin-controlled user creation)

---

## ⚙️ Setup Instructions

### Prerequisites

* Node.js 18+
* Python 3.10+
* PostgreSQL

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### Environment Variables

**Frontend (.env)**

```
VITE_API_URL=http://localhost:8000
```

**Backend (.env)**

```
DATABASE_URL=postgresql://user:password@localhost/fitmate
SECRET_KEY=your_secret_key
OPENAI_API_KEY=your_openai_key
```

---

## 📌 Project Status

✔ Core gym management features implemented
✔ Role-based dashboards functional
✔ AI chatbot integrated
✔ Manual fitness tracking supported

---

## 📄 License

This project is developed for **academic and educational purposes**.
