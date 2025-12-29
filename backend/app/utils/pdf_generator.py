from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

def generate_receipt_pdf(payment, output_dir="receipts"):
    os.makedirs(output_dir, exist_ok=True)

    filename = f"{payment.receipt_number}.pdf"
    filepath = os.path.join(output_dir, filename)

    c = canvas.Canvas(filepath, pagesize=letter)
    
    c.drawString(100, 750, "FitMate Gym Receipt")
    c.drawString(100, 730, f"Receipt Number: {payment.receipt_number}")
    c.drawString(100, 710, f"User: {payment.user.email}")
    c.drawString(100, 690, f"Plan: {payment.plan.name}")
    c.drawString(100, 670, f"Amount: ₹{payment.amount}")
    c.drawString(100, 650, f"Payment Mode: {payment.payment_mode}")
    c.drawString(100, 630, f"Date: {payment.created_at}")

    c.save()
    return filepath
