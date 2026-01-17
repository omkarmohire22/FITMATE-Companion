import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to, subject, body):
    """
    Send email using Gmail SMTP.
    Requires SMTP_EMAIL and SMTP_PASSWORD in .env
    For Gmail, use an App Password: https://myaccount.google.com/apppasswords
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_EMAIL", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user or not smtp_pass:
        print(f"[WARNING] SMTP not configured. OTP for {to}: check server logs")
        print(f"[OTP DEBUG] Would send to {to}: {body}")
        return False

    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to, msg.as_string())
        server.quit()
        print(f"[EMAIL] OTP sent successfully to {to}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send OTP to {to}: {e}")
        return False
