# 🏋️ FitMate Pro - AI-Powered Smart Gym Management System

## Overview

FitMate Pro is an AI-powered Smart Gym Management System that unifies trainees, trainers, and gym owners on one intelligent platform. It combines AI-based coaching, performance analytics, nutrition management, and business intelligence.

## 🚀 Features

### Core Features
- **AI Workout Tracker** - Real-time form analysis using MediaPipe & OpenCV
- **Multi-Role System** - Admin, Trainer, and Trainee dashboards
- **Nutrition Tracking** - AI-powered meal planning and food recognition
- **Progress Analytics** - ML-based predictions and trend analysis
- **AI Chatbot** - 24/7 fitness assistant powered by OpenAI
- **Secure Authentication** - Multiple login options with admin-specific security

### Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Recharts
- MediaPipe Pose Detection
- React Hook Form + Zod

**Backend:**
- FastAPI (Python)
- PostgreSQL
- JWT Authentication
- Redis (Caching)
- Supabase (Realtime & Storage)

**AI/ML:**
- MediaPipe Pose
- OpenCV
- OpenAI API
- TensorFlow.js

## 📁 Project Structure

```
FitMate/
├── frontend/          # React application
├── backend/           # FastAPI application
├── docker-compose.yml # Local development setup
└── README.md
```

## 🔐 Authentication Features

- Email/Password login
- Google OAuth
- GitHub OAuth
- Phone OTP (optional)
- Admin-specific 2FA
- Session management
- IP-based restrictions (admin)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Redis (optional)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Frontend (.env):**
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

**Backend (.env):**
```
DATABASE_URL=postgresql://user:password@localhost/fitmate
SECRET_KEY=your_secret_key_here
OPENAI_API_KEY=your_openai_key
REDIS_URL=redis://localhost:6379
```

## 📝 License

MIT

