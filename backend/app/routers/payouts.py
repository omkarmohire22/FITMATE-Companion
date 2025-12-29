from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Trainer, TrainerRevenue, User
from app.auth_util import get_admin_user
from datetime import datetime

router = APIRouter(prefix="/api/payouts", tags=["Payouts"])

@router.post("/trainer/{trainer_id}/record")
async def record_trainer_payout(trainer_id: str, amount: float, notes: str = "", current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(404, "Trainer not found")
    payout = TrainerRevenue(
        trainer_id=trainer.id,
        amount=amount,
        notes=notes,
        paid_at=datetime.utcnow()
    )
    db.add(payout)
    db.commit()
    return {"message": "Payout recorded", "trainer_id": trainer_id, "amount": amount}

@router.get("/trainer/{trainer_id}/history")
async def get_trainer_payout_history(trainer_id: str, db: Session = Depends(get_db)):
    payouts = db.query(TrainerRevenue).filter(TrainerRevenue.trainer_id == trainer_id).order_by(TrainerRevenue.paid_at.desc()).all()
    return {"payouts": [
        {
            "amount": p.amount,
            "notes": p.notes,
            "paid_at": p.paid_at.isoformat() if p.paid_at else None
        } for p in payouts
    ]}
