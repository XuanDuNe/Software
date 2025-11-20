from fastapi import FastAPI, Depends, HTTPException, Header, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, auth_utils
from database import engine, get_db, SessionLocal
import schemas
from typing import Optional
import random
import string
from datetime import datetime, timedelta
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


 # Tạo bảng khi service khởi động, đảm bảo DB đã sẵn sàng

app = FastAPI(title="Auth Service", version="1.0")

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"service": "Auth Service", "status": "running", "port": 8001}

@app.get("/auth/")
def auth_root():
    return {"service": "auth", "status": "ok"}

DEFAULT_ADMIN_EMAIL = "Admin@gmail.com"
DEFAULT_ADMIN_PASSWORD = "Admin123"

# Cấu hình Gmail SMTP
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "nguyenxuandu0401@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "noduyuwsgykampbl")
APP_NAME = os.getenv("APP_NAME", "Edumatch")


def generate_otp(length=6):
    """Tạo mã OTP ngẫu nhiên"""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(recipient_email: str, otp_code: str):
    """Gửi email OTP qua Gmail SMTP"""
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
        
        msg = MIMEMultipart()
        msg['From'] = SMTP_EMAIL
        msg['To'] = recipient_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html', 'utf-8'))
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        text = msg.as_string()
        server.sendmail(SMTP_EMAIL, recipient_email, text)
        server.quit()
        
        print(f"✅ OTP email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send OTP email: {e}")
        return False


def ensure_default_admin():
    session: Session = SessionLocal()
    try:
        admin_user = session.query(models.User).filter(models.User.email == DEFAULT_ADMIN_EMAIL).first()
        if not admin_user:
            hashed_password = auth_utils.hash_password(DEFAULT_ADMIN_PASSWORD)
            admin_user = models.User(
                email=DEFAULT_ADMIN_EMAIL,
                password_hash=hashed_password,
                role="admin",
                is_verified=True
            )
            session.add(admin_user)
            session.commit()
            print("✅ Default admin account created.")
        else:
            if admin_user.role != "admin":
                admin_user.role = "admin"
                session.add(admin_user)
                session.commit()
            print("ℹ️ Default admin account already exists.")
    except Exception as e:
        session.rollback()
        print(f"⚠️ Failed to ensure default admin account: {e}")
    finally:
        session.close()


def require_admin(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    payload = auth_utils.verify_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return payload


@app.on_event("startup")
def on_startup():
    try:
        models.Base.metadata.create_all(bind=engine)
        ensure_default_admin()
    except Exception as e:
        # Để logs trong container cho dễ debug khi DB chưa sẵn sàng
        print(f"DB init error: {e}")

@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    # bcrypt giới hạn 72 bytes
    if len(user.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    normalized_role = user.role.lower()
    if normalized_role not in ["student", "provider"]:
        raise HTTPException(status_code=400, detail="Only student or provider accounts can be registered")

    hashed_password = auth_utils.hash_password(user.password)
    new_user = models.User(email=user.email, password_hash=hashed_password, role=normalized_role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth_utils.create_access_token({"sub": new_user.email, "role": new_user.role, "user_id": new_user.id})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    try:
        valid_pw = db_user is not None and auth_utils.verify_password(user.password, db_user.password_hash)
    except ValueError:
        # trường hợp password >72 bytes
        valid_pw = False
    if not valid_pw:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_utils.create_access_token({"sub": db_user.email, "role": db_user.role, "user_id": db_user.id})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/verify-token")
def verify_token(token_data: schemas.TokenVerify):
    payload = auth_utils.verify_token(token_data.token)
    return {"valid": True, "email": payload.get("sub"), "role": payload.get("role"), "user_id": payload.get("user_id")}

@app.get("/auth/users", response_model=schemas.UserListResponse)
def get_all_users(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_admin(authorization)
    users = db.query(models.User).order_by(models.User.id.asc()).all()
    return {"total": len(users), "users": users}


@app.patch("/auth/users/{user_id}/role", response_model=schemas.UserPublic)
def update_user_role(user_id: int, payload: schemas.UserRoleUpdate, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_admin(authorization)
    normalized_role = payload.role.lower()
    if normalized_role not in ["student", "provider"]:
        raise HTTPException(status_code=400, detail="Role must be student or provider")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email == DEFAULT_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot change default admin account role")

    user.role = normalized_role
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.delete("/auth/users/{user_id}", status_code=204)
def delete_user(user_id: int, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    require_admin(authorization)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == DEFAULT_ADMIN_EMAIL:
        raise HTTPException(status_code=400, detail="Cannot delete default admin account")

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post("/auth/send-otp")
def send_otp(request: schemas.OTPRequest, db: Session = Depends(get_db)):
    """Gửi mã OTP đến email"""
    # Kiểm tra email đã đăng ký chưa
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Kiểm tra role hợp lệ
    normalized_role = request.role.lower()
    if normalized_role not in ["student", "provider"]:
        raise HTTPException(status_code=400, detail="Role must be student or provider")
    
    # Xóa các OTP cũ của email này (nếu có)
    db.query(models.OTP).filter(
        models.OTP.email == request.email,
        models.OTP.purpose == "registration",
        models.OTP.is_used == False
    ).delete()
    
    # Tạo mã OTP mới
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Lưu OTP vào database
    new_otp = models.OTP(
        email=request.email,
        otp_code=otp_code,
        purpose="registration",
        expires_at=expires_at
    )
    db.add(new_otp)
    db.commit()
    
    # Gửi email OTP
    if send_otp_email(request.email, otp_code):
        return {"message": "OTP sent successfully", "email": request.email}
    else:
        # Xóa OTP nếu gửi email thất bại
        db.delete(new_otp)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to send OTP email")


@app.post("/auth/verify-otp-register", response_model=schemas.Token)
def verify_otp_and_register(request: schemas.OTPVerify, db: Session = Depends(get_db)):
    """Xác thực OTP và đăng ký tài khoản"""
    # Kiểm tra email đã đăng ký chưa
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Tìm OTP hợp lệ
    otp_record = db.query(models.OTP).filter(
        models.OTP.email == request.email,
        models.OTP.otp_code == request.otp_code,
        models.OTP.purpose == "registration",
        models.OTP.is_used == False,
        models.OTP.expires_at > datetime.utcnow()
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Kiểm tra role hợp lệ
    normalized_role = request.role.lower()
    if normalized_role not in ["student", "provider"]:
        raise HTTPException(status_code=400, detail="Role must be student or provider")
    
    # Kiểm tra mật khẩu
    if len(request.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")
    
    # Tạo user mới
    hashed_password = auth_utils.hash_password(request.password)
    new_user = models.User(
        email=request.email,
        password_hash=hashed_password,
        role=normalized_role,
        is_verified=True  # Đã xác thực qua OTP
    )
    db.add(new_user)
    
    # Đánh dấu OTP đã sử dụng
    otp_record.is_used = True
    
    db.commit()
    db.refresh(new_user)
    
    # Tạo token
    token = auth_utils.create_access_token({
        "sub": new_user.email,
        "role": new_user.role,
        "user_id": new_user.id
    })
    
    return {"access_token": token, "token_type": "bearer"}
