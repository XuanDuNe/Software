import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from database import get_session
from models import EmailLog
from datetime import datetime

# Cấu hình Gmail SMTP
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "nguyenxuandu0401@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "nodu yuws gyka mpbl")
APP_NAME = os.getenv("APP_NAME", "Edumatch")

async def send_email_async(log_id: int, subject: str, recipient_email: str, body: str):
    """
    Hàm này chạy nền (background task) để gửi email qua Gmail SMTP.
    Nó cập nhật trạng thái EmailLog sau khi hoàn thành.
    """
    try:
        # Tạo email message
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Thêm body vào email
        msg.attach(MIMEText(body, 'html', 'utf-8'))
        
        # Kết nối và gửi email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_EMAIL, recipient_email, text)
        server.quit()
        
        print(f"✅ Email sent successfully to {recipient_email}")
        
        # Cập nhật EmailLog
        with get_session() as session:
            db_log = session.get(EmailLog, log_id)
            if db_log:
                db_log.status = "sent"
                db_log.sent_at = datetime.utcnow()
                session.add(db_log)
                session.commit()
    except Exception as e:
        print(f"❌ Failed to send email to {recipient_email}: {e}")
        # Cập nhật trạng thái lỗi
        try:
            with get_session() as session:
                db_log = session.get(EmailLog, log_id)
                if db_log:
                    db_log.status = "failed"
                    session.add(db_log)
                    session.commit()
        except Exception as update_error:
            print(f"Failed to update EmailLog {log_id}: {update_error}")


def send_otp_email_sync(recipient_email: str, otp_code: str):
    """
    Hàm đồng bộ để gửi email OTP (dùng khi cần gửi ngay lập tức).
    """
    try:
        subject = f"{APP_NAME} - Mã xác thực đăng ký"
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4CAF50;">Xin chào!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>{APP_NAME}</strong>.</p>
                <p>Mã xác thực OTP của bạn là:</p>
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                    <h1 style="color: #4CAF50; margin: 0; font-size: 32px; letter-spacing: 5px;">{otp_code}</h1>
                </div>
                <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
                <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </body>
        </html>
        """
        
        # Tạo email message
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Thêm body vào email
        msg.attach(MIMEText(body, 'html', 'utf-8'))
        
        # Kết nối và gửi email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_EMAIL, recipient_email, text)
        server.quit()
        
        print(f"✅ OTP email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send OTP email to {recipient_email}: {e}")
        return False