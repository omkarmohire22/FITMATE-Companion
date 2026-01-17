from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from pydantic import BaseModel
from typing import Optional, List
import os

from app.database import get_db
from app.models import User, Message, Trainer, Trainee, UserRole, Notification
from app.auth_util import require_role, get_current_user

router = APIRouter()

# ====================== OPENAI CONFIG ======================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = None

if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
    except ImportError:
        print("⚠️ OpenAI SDK not installed. Run: pip install openai")

# ====================== SCHEMAS ======================

class ChatQuery(BaseModel):
    message: str
    conversation_id: str | None = None


# ====================== FITNESS KNOWLEDGE BASE ======================

def get_fitness_response(message: str) -> str:
    """
    Fallback AI responses using pattern matching and knowledge base.
    Used when OpenAI API is unavailable or quota exceeded.
    """
    message_lower = message.lower()
    
    # Workout advice
    if any(word in message_lower for word in ['workout', 'exercise', 'training', 'fit', 'gym']):
        if 'beginner' in message_lower or 'start' in message_lower:
            return "Great! For beginners, I recommend starting with 3 days per week of compound exercises:\n\n✓ Day 1: Squat, Bench Press, Rows\n✓ Day 2: Deadlifts, Overhead Press, Pull-ups\n✓ Day 3: Lunges, Incline Press, Lat Pulldowns\n\nStart with 3x8-12 reps per exercise. Focus on proper form over heavy weight. Rest 48 hours between muscle groups. 💪"
        elif 'strength' in message_lower or 'muscle' in message_lower:
            return "For muscle building, follow the **Progressive Overload Principle**:\n\n1. **Heavy Compound Lifts**: Squat, Deadlift, Bench Press (3-5 reps)\n2. **Hypertrophy Work**: 6-12 rep ranges with 60-90 sec rest\n3. **Volume**: 12-20 sets per muscle group per week\n4. **Protein**: 1.6-2.2g per kg of body weight\n5. **Progression**: Add weight or reps each week\n\nConsistency > Perfection! 🔥"
        elif 'cardio' in message_lower or 'endurance' in message_lower or 'running' in message_lower:
            return "**Cardio Training Protocol**:\n\n✓ **Steady State**: 20-30 min at 60-70% max HR, 2-3x/week\n✓ **HIIT**: 30 sec hard + 90 sec easy, 10-15 rounds, 1-2x/week\n✓ **LISS**: 45-60 min low intensity, 1x/week\n\nMix methods to improve both aerobic capacity and work capacity. Don't overdo cardio if building muscle! 🏃"
        else:
            return "**Complete Workout Framework**:\n\n1. **Warm-up** (5-10 min): Light cardio + dynamic stretching\n2. **Main Work** (30-45 min): Strength or hypertrophy training\n3. **Cool-down** (5-10 min): Light stretching + mobility\n\n**Weekly**: 3-4 days strength, 2-3 days cardio, 1-2 rest days\nProgram Design: Block periodization for best results! 💯"
    
    # Nutrition advice
    elif any(word in message_lower for word in ['diet', 'nutrition', 'food', 'eat', 'meal', 'protein', 'carb', 'fat']):
        if 'weight loss' in message_lower or 'lose' in message_lower or 'cut' in message_lower:
            return "**Fat Loss Nutrition Protocol**:\n\n📊 **Caloric Deficit**: 300-500 kcal below maintenance\n🥩 **Protein**: 1.8-2.2g per kg (maintains muscle)\n🥕 **Carbs & Fats**: Fill remaining calories (prefer whole foods)\n\n**Meal Timing**: 3-5 meals spread throughout day\n**Hydration**: 3-4L water daily\n**Sustainability**: Can you follow this for 12+ weeks?\n\nLosing 0.5-1kg/week is ideal! ⚖️"
        elif 'muscle' in message_lower or 'gain' in message_lower or 'bulk' in message_lower:
            return "**Muscle Gain Nutrition Protocol**:\n\n📊 **Caloric Surplus**: +300-500 kcal above maintenance\n🥩 **Protein**: 1.6-2.2g per kg body weight\n🍚 **Carbs**: 4-6g per kg (fuel your workouts)\n🥑 **Fats**: 1-1.5g per kg (hormone health)\n\n**Meal Timing**: Distribute across 4-5 meals\n**Post-Workout**: Carbs + Protein within 2 hours\n**Weight Gain**: Aim for 0.25-0.5kg per week\n\nGaining slowly preserves muscle mass! 💪"
        else:
            return "**Optimal Nutrition Structure**:\n\n🥗 **Protein** (30-35%): Chicken, fish, eggs, Greek yogurt\n🍚 **Carbs** (40-45%): Oats, rice, sweet potato, whole grain bread\n🥑 **Fats** (20-25%): Avocado, nuts, olive oil, fatty fish\n\n**Micronutrients**: 5+ servings of vegetables daily\n**Meal Prep**: Prepare meals for the week\n**Hydration**: 3-4L water daily\n\nConsistency with nutrition is 80% of results! 🥗"
    
    # Progress tracking
    elif any(word in message_lower for word in ['progress', 'track', 'measure', 'weight', 'body', 'measurement']):
        return "**Progress Tracking Framework**:\n\n📊 **Metrics to Track**:\n✓ Body weight (weekly average)\n✓ Body measurements (monthly)\n✓ Strength levels (every session)\n✓ Photos (monthly side-by-side)\n✓ How clothes fit\n✓ Energy levels & sleep\n\n⚠️ **Important**: Weight fluctuates 1-3kg daily!\n✓ Track trends over 4+ weeks, not daily\n✓ Progress isn't always linear\n✓ Trust the process! 📈"
    
    # Recovery & sleep
    elif any(word in message_lower for word in ['sleep', 'rest', 'recovery', 'sore', 'fatigue', 'tired']):
        return "**Recovery Optimization**:\n\n😴 **Sleep Priority**:\n✓ 7-9 hours per night (non-negotiable)\n✓ Consistent sleep schedule (even weekends)\n✓ Dark, cool room (65-68°F)\n✓ No screens 30-60 min before bed\n\n🛀 **Active Recovery**:\n✓ Light stretching 10-15 min daily\n✓ Foam rolling sore muscles\n✓ Mobility work (yoga, tai chi)\n✓ 1-2 complete rest days per week\n\n💧 **Nutrition**: Protein + carbs within 2 hours of training\n\nRecovery = Muscle growth happens here! 💪"
    
    # Motivation
    elif any(word in message_lower for word in ['motivat', 'lazy', 'tired', 'no time', 'discourage', 'quit']):
        return "💪 **You've Got This!**\n\n✨ Remember:\n✓ Every workout counts, even 10 minutes\n✓ Progress is progress, no matter how small\n✓ Consistency beats perfection\n✓ You're investing in FUTURE YOU\n✓ It gets easier, trust the process\n\n🔥 **Quick Win Strategy**:\nStart with just 5-10 minutes today. That's it.\nOnce you start, you'll likely continue.\nBuild momentum, don't break the chain!\n\nYou are capable of amazing things! 🌟"
    
    # Default response
    else:
        return "I'm here to help with fitness, nutrition, workout programming, recovery, and motivation! 💪\n\nAsk me about:\n✓ **Workouts**: Programs, exercises, form\n✓ **Nutrition**: Meal plans, macros, diet strategies  \n✓ **Progress**: Tracking, measurements, goals\n✓ **Recovery**: Sleep, stretching, rest days\n✓ **Motivation**: Overcoming plateaus, staying consistent\n\nWhat would you like help with?"


# ====================== CHAT ======================

@router.post("/query")
async def chat_with_ai(
    query: ChatQuery,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db),
):
    try:
        # Try OpenAI first if available
        if client:
            system_prompt = f"""
You are FitMate Pro AI, a professional fitness assistant.
User: {current_user.name}
Role: {current_user.role.value if hasattr(current_user.role, 'value') else current_user.role}

Give accurate fitness advice. Be motivational and clear. Keep responses concise and actionable.
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query.message},
                ],
                temperature=0.7,
                max_tokens=400,
            )

            ai_response = response.choices[0].message.content

            return {
                "response": ai_response,
                "status": "success",
                "conversation_id": query.conversation_id or "new",
                "ai_type": "gpt-4o-mini"
            }
        else:
            # Use fallback knowledge base
            ai_response = get_fitness_response(query.message)
            return {
                "response": ai_response,
                "status": "success",
                "conversation_id": query.conversation_id or "new",
                "ai_type": "fallback_kb"
            }

    except Exception as e:
        print("Chat error:", e)
        
        # Fallback to knowledge base on any error
        ai_response = get_fitness_response(query.message)
        return {
            "response": ai_response,
            "status": "success",
            "conversation_id": query.conversation_id or "new",
            "ai_type": "fallback_kb",
            "note": "Using offline knowledge base"
        }


# ====================== STATUS ======================

@router.get("/")
async def chat_root():
    """Root endpoint for chat API status check"""
    return {
        "status": "running",
        "openai_configured": client is not None,
        "fallback_available": True,
        "message": "AI chatbot with intelligent fallback responses always available"
    }

@router.get("/status")
async def chat_status():
    """Detailed status endpoint"""
    return {
        "status": "running",
        "openai_configured": client is not None,
        "fallback_available": True,
        "message": "AI chatbot with intelligent fallback responses always available"
    }


# ====================== HISTORY (PLACEHOLDER) ======================

@router.get("/history")
async def get_chat_history(
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    return {
        "conversations": [],
        "message": "Chat history not implemented yet"
    }


# ====================== ALIAS SEND ======================

@router.post("/send")
async def send_message(
    query: ChatQuery,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    return await chat_with_ai(query, current_user, db)


# ====================== USER-TO-USER MESSAGING ======================

class SendMessageRequest(BaseModel):
    receiver_id: int
    message: str


class MarkReadRequest(BaseModel):
    message_ids: List[int]


@router.post("/messages/send")
async def send_user_message(
    data: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to another user (trainer, trainee, or admin)"""
    
    # Verify receiver exists
    receiver = db.query(User).filter(User.id == data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        receiver_id=data.receiver_id,
        message=data.message,
        is_read=False
    )
    db.add(message)
    
    # Create notification for the receiver
    notification = Notification(
        user_id=data.receiver_id,
        title=f"💬 New message from {current_user.name}",
        message=data.message[:100] + ("..." if len(data.message) > 100 else ""),
        notification_type="message",
        is_read=False
    )
    db.add(notification)
    
    db.commit()
    db.refresh(message)
    
    return {
        "status": "success",
        "message_id": message.id,
        "sent_at": message.created_at.isoformat() if message.created_at else None
    }


@router.put("/messages/{user_id}/read")
async def mark_messages_as_read(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all messages from a specific user as read"""
    # Mark messages as read
    updated = db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    
    # Also mark message notifications from this user as read
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.notification_type == "message",
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {
        "status": "success",
        "messages_marked_read": updated
    }


@router.get("/messages/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print("[DEBUG] /messages/conversations called for user:", current_user.id)
    # Get all unique users this user has communicated with
    sent_to = db.query(Message.receiver_id).filter(Message.sender_id == current_user.id).distinct().all()
    print("[DEBUG] sent_to:", sent_to)
    received_from = db.query(Message.sender_id).filter(Message.receiver_id == current_user.id).distinct().all()
    print("[DEBUG] received_from:", received_from)
    user_ids = set([r[0] for r in sent_to] + [r[0] for r in received_from])
    print("[DEBUG] user_ids:", user_ids)
    conversations = []
    for user_id in user_ids:
        print(f"[DEBUG] Processing user_id: {user_id}")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"[DEBUG] User id {user_id} not found, skipping.")
            continue
        # Get last message
        last_message = db.query(Message).filter(
            or_(
                and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
                and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
            )
        ).order_by(Message.created_at.desc()).first()
        print(f"[DEBUG] Last message for user_id {user_id}: {last_message}")
        # Count unread messages
        unread_count = db.query(Message).filter(
            Message.sender_id == user_id,
            Message.receiver_id == current_user.id,
            Message.is_read == False
        ).count()
        print(f"[DEBUG] Unread count for user_id {user_id}: {unread_count}")
        conversations.append({
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "user_role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "last_message": last_message.message if last_message else None,
            "last_message_time": last_message.created_at.isoformat() if last_message and last_message.created_at else None,
            "unread_count": unread_count
        })
    print("[DEBUG] Finished building conversations list.")
    # Sort by last message time
    conversations.sort(key=lambda x: x["last_message_time"] or "", reverse=True)
    print("[DEBUG] Returning conversations response.")
    return {"conversations": conversations}


@router.get("/messages/contacts/available")
async def get_available_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] /messages/contacts/available called for user: {current_user.id} role: {current_user.role}")
    contacts = []
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    print(f"[DEBUG] user_role: {user_role}")
    if user_role == "TRAINEE":
        trainee_profile = db.query(Trainee).filter(Trainee.user_id == current_user.id).first()
        print(f"[DEBUG] trainee_profile: {trainee_profile}")
        if trainee_profile and trainee_profile.trainer_id:
            trainer = db.query(Trainer).filter(Trainer.id == trainee_profile.trainer_id).first()
            print(f"[DEBUG] trainer: {trainer}")
            if trainer and trainer.user:
                contacts.append({
                    "id": trainer.user.id,
                    "name": trainer.user.name,
                    "email": trainer.user.email,
                    "role": "TRAINER",
                    "label": "My Trainer"
                })
        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        print(f"[DEBUG] admins: {admins}")
        for admin in admins:
            contacts.append({
                "id": admin.id,
                "name": admin.name,
                "email": admin.email,
                "role": "ADMIN",
                "label": "Admin"
            })
    elif user_role == "TRAINER":
        trainer_profile = db.query(Trainer).filter(Trainer.user_id == current_user.id).first()
        print(f"[DEBUG] trainer_profile: {trainer_profile}")
        if trainer_profile:
            trainees = db.query(Trainee).filter(Trainee.trainer_id == trainer_profile.id).all()
            print(f"[DEBUG] trainees: {trainees}")
            for t in trainees:
                if t.user:
                    contacts.append({
                        "id": t.user.id,
                        "name": t.user.name,
                        "email": t.user.email,
                        "role": "TRAINEE",
                        "label": "Trainee"
                    })
        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        print(f"[DEBUG] admins: {admins}")
        for admin in admins:
            contacts.append({
                "id": admin.id,
                "name": admin.name,
                "email": admin.email,
                "role": "ADMIN",
                "label": "Admin"
            })
    elif user_role == "ADMIN":
        all_users = db.query(User).filter(User.id != current_user.id, User.is_active == True).all()
        print(f"[DEBUG] all_users: {all_users}")
        for user in all_users:
            contacts.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "label": user.role.value if hasattr(user.role, 'value') else str(user.role)
            })
    print(f"[DEBUG] Returning contacts: {contacts}")
    return {"contacts": contacts}


@router.get("/messages/unread/count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread messages"""
    count = db.query(Message).filter(
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).count()
    
    return {"unread_count": count}


# NOTE: This route MUST be after static routes like /messages/contacts/available
# because FastAPI matches routes in order
@router.get("/messages/{user_id}")
async def get_messages_with_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages with a specific user"""
    
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == current_user.id, Message.receiver_id == user_id),
            and_(Message.sender_id == user_id, Message.receiver_id == current_user.id)
        )
    ).order_by(Message.created_at.asc()).all()
    
    # Mark received messages as read
    db.query(Message).filter(
        Message.sender_id == user_id,
        Message.receiver_id == current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {
        "messages": [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "receiver_id": m.receiver_id,
                "message": m.message,
                "is_read": m.is_read,
                "is_mine": m.sender_id == current_user.id,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ]
    }
