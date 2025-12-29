from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.database import SessionLocal
from app.models import Message

router = APIRouter()
active_users = {}

@router.websocket("/ws/chat/{user_id}")
async def websocket_chat(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_users[user_id] = websocket

    try:
        while True:
            data = await websocket.receive_json()
            sender = data["sender_id"]
            receiver = data["receiver_id"]
            msg = data["message"]

            db = SessionLocal()
            message = Message(
                sender_id=sender,
                receiver_id=receiver,
                message=msg
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            if receiver in active_users:
                await active_users[receiver].send_json({
                    "sender_id": sender,
                    "message": msg,
                    "time": message.created_at.isoformat()
                })
    except WebSocketDisconnect:
        del active_users[user_id]
