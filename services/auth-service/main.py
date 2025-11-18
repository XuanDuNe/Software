from fastapi import FastAPI, Depends, HTTPException, Header, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, auth_utils
from database import engine, get_db, SessionLocal
import schemas
from typing import Optional


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
