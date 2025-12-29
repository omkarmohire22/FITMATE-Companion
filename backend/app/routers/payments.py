from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from decouple import config
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import razorpay
import time
from app.database import get_db
from app.models import Payment, User, MembershipPlan, Membership
from app.auth_util import require_role, get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

RAZORPAY_KEY_ID = config("RAZORPAY_KEY_ID", default=None)
RAZORPAY_KEY_SECRET = config("RAZORPAY_KEY_SECRET", default=None)

if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None


# ====================== SCHEMAS ======================

class CreateOrderRequest(BaseModel):
    amount: float
    plan_id: Optional[int] = None  # Optional: link to membership plan


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: Optional[int] = None


# ====================== GET MEMBERSHIP PLANS (PUBLIC) ======================

@router.get("/plans")
async def get_membership_plans(db: Session = Depends(get_db)):
    """Get all active membership plans for trainees to view"""
    plans = db.query(MembershipPlan).filter(MembershipPlan.is_active == True).all()
    return {
        "plans": [
            {
                "id": p.id,
                "name": p.name,
                "membership_type": p.membership_type,
                "price": p.price,
                "duration_months": p.duration_months,
                "features": p.features.split(",") if p.features else [],
                "is_active": p.is_active,
            }
            for p in plans
        ]
    }


# ====================== CREATE ORDER FOR PLAN ======================

@router.post("/create-order")
async def create_razorpay_order(
    data: CreateOrderRequest,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    """Create a Razorpay order for payment"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured. Please contact admin.")
    
    amount = data.amount
    plan_id = data.plan_id
    
    # If plan_id provided, validate and get price from plan
    plan = None
    if plan_id:
        plan = db.query(MembershipPlan).filter(MembershipPlan.id == plan_id, MembershipPlan.is_active == True).first()
        if not plan:
            raise HTTPException(status_code=404, detail="Membership plan not found")
        amount = plan.price
    
    amount_paise = int(amount * 100)
    
    order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"receipt_{current_user.id}_{int(time.time())}",
        "notes": {
            "user_id": str(current_user.id),
            "plan_id": str(plan_id) if plan_id else ""
        }
    })
    
    # Create payment record
    payment = Payment(
        trainee_id=current_user.id,
        amount=amount,
        provider="razorpay",
        status="pending",
        transaction_id=order["id"],
        notes=f"Plan: {plan.name}" if plan else None
    )
    db.add(payment)
    db.commit()
    
    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "duration_months": plan.duration_months
        } if plan else None
    }


# ====================== VERIFY PAYMENT ======================

@router.post("/verify-payment")
async def verify_razorpay_payment(
    data: VerifyPaymentRequest,
    current_user: User = Depends(require_role(["trainee", "trainer", "admin"])),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment and activate membership"""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    
    params_dict = {
        "razorpay_order_id": data.razorpay_order_id,
        "razorpay_payment_id": data.razorpay_payment_id,
        "razorpay_signature": data.razorpay_signature
    }
    
    try:
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Update payment record
        payment = db.query(Payment).filter(Payment.transaction_id == data.razorpay_order_id).first()
        if payment:
            payment.status = "completed"
            payment.transaction_id = data.razorpay_payment_id
            db.commit()
        
        # If plan_id provided, create/update membership
        if data.plan_id:
            plan = db.query(MembershipPlan).filter(MembershipPlan.id == data.plan_id).first()
            if plan:
                start_date = datetime.utcnow()
                end_date = start_date + timedelta(days=plan.duration_months * 30)
                
                # Check for existing active membership
                existing = db.query(Membership).filter(
                    Membership.trainee_id == current_user.id,
                    Membership.status == "active"
                ).first()
                
                if existing:
                    # Extend existing membership
                    existing.end_date = existing.end_date + timedelta(days=plan.duration_months * 30)
                    existing.membership_type = plan.membership_type
                    existing.price = plan.price
                else:
                    # Create new membership
                    membership = Membership(
                        trainee_id=current_user.id,
                        membership_type=plan.membership_type,
                        start_date=start_date,
                        end_date=end_date,
                        status="active",
                        price=plan.price,
                    )
                    db.add(membership)
                
                db.commit()
        
        return {
            "status": "success",
            "message": "Payment verified and membership activated!",
            "payment_id": data.razorpay_payment_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payment signature: {str(e)}")


# ====================== GET MY PAYMENTS ======================

@router.get("/my-payments")
async def get_my_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment history for current user"""
    payments = db.query(Payment).filter(Payment.trainee_id == current_user.id).order_by(Payment.created_at.desc()).all()
    return {
        "payments": [
            {
                "id": p.id,
                "amount": p.amount,
                "status": p.status,
                "provider": p.provider,
                "transaction_id": p.transaction_id,
                "notes": p.notes,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments
        ]
    }


# ====================== GET MY MEMBERSHIP ======================

@router.get("/my-membership")
async def get_my_membership(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's active membership"""
    membership = db.query(Membership).filter(
        Membership.trainee_id == current_user.id,
        Membership.status == "active"
    ).first()
    
    if not membership:
        return {"membership": None, "message": "No active membership found"}
    
    return {
        "membership": {
            "id": membership.id,
            "membership_type": membership.membership_type,
            "start_date": membership.start_date.isoformat() if membership.start_date else None,
            "end_date": membership.end_date.isoformat() if membership.end_date else None,
            "status": membership.status,
            "price": membership.price,
            "days_remaining": (membership.end_date - datetime.utcnow()).days if membership.end_date else 0
        }
    }
