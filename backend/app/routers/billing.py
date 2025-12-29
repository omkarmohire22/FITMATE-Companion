from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import os
import random
from typing import Optional

from app.database import get_db
from app.models import Payment, Expense
from app.auth_util import get_admin_user
from app.schemas import RefundPaymentRequest, ExpenseCreate

router = APIRouter()

# helper: generate receipt number
def generate_receipt_number() -> str:
    return "FM-" + datetime.utcnow().strftime("%Y%m%d") + "-" + str(
        random.randint(10000, 99999)
    )

# ---------------- PAYMENTS LIST WITH FILTERS ---------------- #

@router.get("/billing/payments")
async def list_payments(
    mode: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    q = db.query(Payment)

    if mode:
        q = q.filter(Payment.payment_mode == mode.lower())

    if status:
        q = q.filter(Payment.status == status)

    if search:
        search_like = f"%{search.lower()}%"
        # assumes you maybe store trainee_email / user_email in payment table
        q = q.filter(
            func.lower(Payment.receipt_number).like(search_like)
        )

    payments = q.order_by(Payment.created_at.desc()).all()

    return {
        "payments": [
            {
                "id": p.id,
                "amount": float(p.amount or 0),
                "status": p.status,
                "payment_mode": p.payment_mode,
                "provider": p.provider,
                "trainee_email": getattr(p, "trainee_email", None),
                "user_email": getattr(p, "user_email", None),
                "receipt_number": p.receipt_number,
                "receipt_pdf_url": p.receipt_pdf_url,
                "is_refund": p.is_refund,
                "created_at": p.created_at.isoformat()
                if p.created_at
                else None,
            }
            for p in payments
        ]
    }

# ---------------- REFUND PAYMENT ---------------- #

@router.post("/billing/refund")
async def refund_payment(
    data: RefundPaymentRequest,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.id == data.payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.is_refund:
        raise HTTPException(status_code=400, detail="Payment already refunded")

    if data.refund_amount > (payment.amount or 0):
        raise HTTPException(status_code=400, detail="Refund exceeds original amount")

    payment.is_refund = True
    payment.refund_amount = data.refund_amount
    payment.refund_reason = data.refund_reason

    db.commit()
    return {"message": "Refund processed successfully"}

# ---------------- DOWNLOAD RECEIPT ---------------- #

@router.get("/billing/receipt/{payment_id}")
async def get_receipt(
    payment_id: int,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # If you already have a generated PDF path, just return it
    if payment.receipt_pdf_url and os.path.exists(payment.receipt_pdf_url):
        filename = os.path.basename(payment.receipt_pdf_url)
        return FileResponse(
            payment.receipt_pdf_url,
            media_type="application/pdf",
            filename=filename,
        )

    # fallback: simple placeholder text PDF not implemented
    raise HTTPException(status_code=404, detail="Receipt PDF not available yet")

# ---------------- EXPENSES ---------------- #

@router.post("/finance/expenses")
async def create_expense(
    data: ExpenseCreate,
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    expense = Expense(**data.dict())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"id": str(expense.id), "message": "Expense added"}

# ---------------- FINANCE EXPORT (PDF/EXCEL) ---------------- #

@router.get("/finance/export")
async def export_finance(
    format: str = Query("pdf", regex="^(pdf|excel)$"),
    current_user=Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    # For now we just return a simple CSV/TSV-style text, front-end will still download
    payments = db.query(Payment).all()

    lines = ["id,amount,status,mode,created_at"]
    for p in payments:
        lines.append(
            f"{p.id},{float(p.amount or 0)},{p.status},{p.payment_mode},{p.created_at or ''}"
        )

    content = "\n".join(lines).encode("utf-8")

    if format == "pdf":
        # simple "fake pdf" as text; for real pdf use ReportLab later
        return FileResponse(
            path_or_file=bytes(content),
            media_type="application/pdf",
            filename="finance-report.pdf",
        )

    # excel -> just send CSV with xlsx mimetype
    return FileResponse(
        path_or_file=bytes(content),
        media_type="application/vnd.ms-excel",
        filename="finance-report.csv",
    )
