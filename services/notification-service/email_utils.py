import httpx
from .database import get_session
from .models import EmailLog
from datetime import datetime

async def send_email_async(log_id: int, subject: str, recipient_email: str, body: str):
    """
    Hàm này chạy nền (background task) để gửi email.
    Nó cập nhật trạng thái EmailLog sau khi hoàn thành.
    """
    
    print(f"--- SIMULATING EMAIL SEND ---")
    print(f"To: {recipient_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body[:50]}...")
    print(f"--- END SIMULATION ---")
    
    import asyncio
    await asyncio.sleep(2) 
    
    try:
        with get_session() as session:
            db_log = session.get(EmailLog, log_id)
            if db_log:
                db_log.status = "sent"
                db_log.sent_at = datetime.utcnow()
                
                session.add(db_log)
                session.commit()
    except Exception as e:
        print(f"Failed to update EmailLog {log_id}: {e}")