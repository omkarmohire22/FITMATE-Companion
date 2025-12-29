
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from sqlalchemy.orm import Session
from app.models import Notification, User, UserRole

router = APIRouter()

class FeedbackRequest(BaseModel):
    user_id: Optional[int]
    message: str
    email: Optional[str]  # Accept any string, not just valid emails
    type: Optional[str] = "feedback"  # or 'bug', 'suggestion', etc.

@router.post("/feedback", summary="Submit user feedback or bug report")
def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    # Find admin user(s)
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()
    if not admin_users:
        raise HTTPException(status_code=500, detail="No admin user found to notify.")

    # Create notification for each admin
    for admin in admin_users:
        notif = Notification(
            user_id=admin.id,
            title=f"New {feedback.type.capitalize()} from User",
            message=f"{feedback.message}\nEmail: {feedback.email or 'N/A'}",
            notification_type="feedback"
        )
        db.add(notif)
    db.commit()

    return {"success": True, "message": "Thank you for your feedback! Our admin team has been notified."}
