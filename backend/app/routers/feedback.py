
from fastapi import APIRouter, Depends, status, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from sqlalchemy.orm import Session
from app.models import Notification, User, UserRole

router = APIRouter()

class FeedbackRequest(BaseModel):
    user_id: Optional[int] = None
    message: str
    email: Optional[str] = None
    type: Optional[str] = "feedback"  # 'feedback', 'bug', 'suggestion'

@router.post("/feedback", summary="Submit user feedback or bug report")
def submit_feedback(feedback: FeedbackRequest, db: Session = Depends(get_db)):
    """
    Submit feedback, bug reports, or suggestions.
    Creates notifications for all admin users.
    """
    # Find admin user(s)
    admin_users = db.query(User).filter(User.role == UserRole.ADMIN).all()
    if not admin_users:
        raise HTTPException(status_code=500, detail="No admin user found to notify.")

    # Get user info if user_id provided
    user_name = "Anonymous User"
    user_info = ""
    if feedback.user_id:
        user = db.query(User).filter(User.id == feedback.user_id).first()
        if user:
            user_name = user.name
            user_info = f"User: {user.name} ({user.role.value})\n"
    
    # Build notification message with user details
    notification_message = f"{user_info}Email: {feedback.email or 'Not provided'}\n\nMessage:\n{feedback.message}"
    
    # Create notification for each admin
    for admin in admin_users:
        notif = Notification(
            user_id=admin.id,
            title=f"New {feedback.type.capitalize()}: {user_name}",
            message=notification_message,
            notification_type="feedback"
        )
        db.add(notif)
    
    db.commit()

    return {
        "success": True,
        "message": "Thank you for your feedback! Our admin team has been notified and will review it shortly."
    }
