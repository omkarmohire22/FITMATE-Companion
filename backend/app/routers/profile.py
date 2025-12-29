from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
from ..models import User  # Adjust import as per your project
from ..database import get_db
from sqlalchemy.orm import Session
import os

router = APIRouter()

UPLOAD_DIR = os.getenv("PROFILE_UPLOAD_DIR", "./profile_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/profile/upload-avatar", summary="Upload profile picture/avatar")
def upload_avatar(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # You should add authentication and user validation here
    filename = f"user_{user_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    # Save file_path or URL to user profile in DB (pseudo-code)
    # user = db.query(User).filter(User.id == user_id).first()
    # user.avatar_url = file_path
    # db.commit()
    return {"success": True, "avatar_url": file_path}
