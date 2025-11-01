from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, auth_utils
from database import engine, get_db

# Tạo bảng nếu chưa có
models.Base.metadata.create_all(bind=engine)

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

@app.post("/auth/register", response_model=schemas.Token)
def register(user: schemas.UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if user.role not in ["student", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Role must be student, provider, or admin")

    hashed_password = auth_utils.hash_password(user.password)
    new_user = models.User(email=user.email, password_hash=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth_utils.create_access_token({"sub": new_user.email, "role": new_user.role, "user_id": new_user.id})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth_utils.verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_utils.create_access_token({"sub": db_user.email, "role": db_user.role, "user_id": db_user.id})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/auth/verify-token")
def verify_token(token_data: schemas.TokenVerify):
    payload = auth_utils.verify_token(token_data.token)
    return {"valid": True, "email": payload.get("sub"), "role": payload.get("role"), "user_id": payload.get("user_id")}

@app.get("/auth/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return {"total": len(users), "users": [{"id": u.id, "email": u.email, "role": u.role} for u in users]}
