import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(to, subject, body, is_html=False):
    """
    Send email using Gmail SMTP.
    Requires SMTP_EMAIL and SMTP_PASSWORD in .env
    For Gmail, use an App Password: https://myaccount.google.com/apppasswords
    
    Args:
        to: Recipient email
        subject: Email subject
        body: Email body (HTML or plain text)
        is_html: Set True for HTML emails
    """
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_EMAIL", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user or not smtp_pass:
        print(f"[WARNING] SMTP not configured. OTP for {to}: check server logs")
        print(f"[OTP DEBUG] Would send to {to}: {body}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = smtp_user
    msg["To"] = to
    msg["Subject"] = subject
    
    # Attach email body (HTML or plain text)
    mime_type = "html" if is_html else "plain"
    msg.attach(MIMEText(body, mime_type))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to, msg.as_string())
        server.quit()
        print(f"[EMAIL] Email sent successfully to {to}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {to}: {e}")
        return False


def send_admin_otp_email(to_email, otp_code):
    """
    Send a professional HTML-formatted OTP verification email to admin.
    
    Args:
        to_email: Admin email address
        otp_code: 6-digit OTP code
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = "FitMate Admin - Secure Login Verification Code"
    
    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 32px 40px; text-align: center;">
                                <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">FitMate</h1>
                                <p style="margin: 8px 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 1.5px;">Admin Portal</p>
                            </td>
                        </tr>
                        
                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 48px 40px 32px;">
                                <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600; color: #1a1a2e; text-align: center;">Verification Required</h2>
                                <p style="margin: 0 0 32px; font-size: 15px; color: #555555; line-height: 1.7; text-align: center;">
                                    A sign-in attempt requires verification. Please use the following one-time password to complete your authentication.
                                </p>
                                
                                <!-- OTP Code Box -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 28px 40px; display: inline-block;">
                                                <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Verification Code</p>
                                                <p style="margin: 0; font-size: 38px; font-weight: 700; color: #1e3a5f; letter-spacing: 10px; font-family: 'Consolas', 'Monaco', monospace;">{otp_code}</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Expiration Notice -->
                                <p style="margin: 28px 0 0; font-size: 13px; color: #dc2626; text-align: center; font-weight: 500;">
                                    This code expires in 10 minutes
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Security Notice -->
                        <tr>
                            <td style="padding: 0 40px 40px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
                                    <tr>
                                        <td style="padding: 16px 20px;">
                                            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 600; color: #92400e;">Security Notice</p>
                                            <p style="margin: 0; font-size: 13px; color: #a16207; line-height: 1.5;">
                                                If you did not initiate this login request, please ignore this email. Never share this code with anyone.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 8px; font-size: 12px; color: #6b7280; text-align: center; line-height: 1.6;">
                                    This is an automated message from FitMate Admin Portal.<br>
                                    Please do not reply to this email.
                                </p>
                                <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center;">
                                    &copy; 2026 FitMate. All rights reserved.
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_body, is_html=True)


def send_user_otp_email(to_email, otp_code, user_name="User", role="Member"):
    """
    Send a professional HTML-formatted OTP verification email to trainee/trainer.
    
    Args:
        to_email: User email address
        otp_code: 6-digit OTP code
        user_name: User's display name
        role: User role (Trainee/Trainer)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"🔐 FitMate {role} Login - Verification Code"
    
    # Determine color scheme based on role
    if role.lower() == "trainer":
        gradient = "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)"
        accent_color = "#3b82f6"
    else:
        gradient = "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
        accent_color = "#10b981"
    
    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 40px 20px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: {gradient}; padding: 32px 24px; text-align: center;">
                <div style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 8px;">🏋️ FitMate</div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.9);">{role} Portal</div>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 32px; text-align: center;">
                <div style="font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">
                    Hi {user_name}! 👋
                </div>
                
                <div style="font-size: 14px; color: #6b7280; margin-bottom: 32px; line-height: 1.6;">
                    Enter this verification code to securely sign in to your FitMate account.
                </div>
                
                <!-- OTP Box -->
                <div style="background: {gradient}; border-radius: 12px; padding: 28px; margin: 28px 0;">
                    <div style="font-size: 11px; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; font-weight: 600;">
                        Your Verification Code
                    </div>
                    <div style="font-size: 42px; font-weight: 700; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {otp_code}
                    </div>
                </div>
                
                <!-- Expiration -->
                <div style="font-size: 13px; color: #6b7280; margin: 24px 0; padding: 14px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
                    ⏱️ <strong>Code expires in 10 minutes</strong>
                </div>
                
                <!-- Security Note -->
                <div style="background: #f9fafb; border-left: 4px solid {accent_color}; padding: 16px; margin: 24px 0; border-radius: 6px; text-align: left;">
                    <div style="font-size: 12px; font-weight: 700; color: #1f2937; margin-bottom: 6px;">🔒 Security Tip</div>
                    <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                        Never share this code with anyone. FitMate staff will never ask for your verification code.
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <div style="font-size: 12px; color: #9ca3af; line-height: 1.6;">
                    <strong>FitMate - AI-Powered Gym Management</strong><br>
                    Didn't request this? Ignore this email.<br><br>
                    © 2026 FitMate. All rights reserved.
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_body, is_html=True)
