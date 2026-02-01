from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from datetime import datetime
from uuid import UUID
import uvicorn
import json
import os

from app.database import engine, Base

# IMPORTANT — import ALL MODELS before create_all
from app import models

# Initialize tables at module load time
Base.metadata.create_all(bind=engine)

# Custom JSON encoder for UUIDs
class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)

# Routers
from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.trainer import router as trainer_router
from app.routers.trainee import router as trainee_router
from app.routers.chat import router as chat_router
from app.routers.chat_socket import router as chat_socket_router
from app.routers.billing import router as billing_router
from app.routers.payments import router as payments_router
from app.routers.payouts import router as payouts_router
from app.routers.progress import router as progress_router
from app.routers.nutrition_tracker_enhanced import router as nutrition_router_enhanced
from app.routers import profile
from app.routers import feedback


app = FastAPI(
    title="FitMate Pro API",
    description="AI-Powered Smart Gym Management System",
    version="1.0.0",
)

# Add HTTPS redirect middleware (enable only in production)
# app.add_middleware(HTTPSRedirectMiddleware)

# Global handler for validation errors (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error: {exc.errors()} for request: {await request.body()}")
    # Remove non-serializable objects from errors
    def clean_error(error):
        error = dict(error)
        ctx = error.get('ctx')
        if ctx and 'error' in ctx and isinstance(ctx['error'], Exception):
            ctx['error'] = str(ctx['error'])
        error['ctx'] = ctx
        return error
    cleaned_errors = [clean_error(e) for e in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"detail": cleaned_errors, "body": getattr(exc, 'body', None)},
    )

# ────────────────────────────────
# CORS — FIXED FOR CREDENTIALS + LOCAL DEV
# ────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3003",
        "http://localhost:3004",  # Added for current Vite instance
        "http://localhost:5173",   # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
        "http://127.0.0.1:5173",
        "https://fitmate-companion-om.vercel.app", # Vercel production
        "https://fitmate-companion-l0ul8oxt-omkars-projects-3aa5e891.vercel.app", # Vercel preview
    ],
    allow_credentials=True,   # This works now because origins are explicit
    allow_methods=["*"],
    allow_headers=["*"],
)

# ────────────────────────────────
# API ROUTERS
# ────────────────────────────────
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
app.include_router(trainer_router, prefix="/api/trainer", tags=["Trainer"])
app.include_router(trainee_router, prefix="/api/trainee", tags=["Trainee"])
app.include_router(progress_router, prefix="/api/trainee", tags=["Progress"])
app.include_router(nutrition_router_enhanced, prefix="/api/nutrition", tags=["Nutrition (Enhanced AI)"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(billing_router, prefix="/api/admin", tags=["Billing & Finance"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])

# Payments router for gateway integration
app.include_router(payments_router)
app.include_router(payouts_router)

# WebSocket MUST BE LAST
app.include_router(chat_socket_router)


@app.get("/")
async def root():
    return {
        "message": "FitMate Pro API running",
        "version": "1.0.0",
        "status": "active",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    print("Running FitMate Pro API on http://0.0.0.0:8000")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

