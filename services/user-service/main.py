from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # ✅ Thêm dòng này
from database import create_db_and_tables
from routes import router as user_router

app = FastAPI(title="User Service")

# ✅ Cho phép frontend (ví dụ: http://127.0.0.1:8080) gọi API backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hoặc ["http://127.0.0.1:8080"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Gắn router chứa các endpoint người dùng
app.include_router(user_router)

# ✅ Tạo DB và bảng khi khởi động
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# ✅ Endpoint test service
@app.get("/")
def root():
    return {"service": "user-service", "status": "ok"}
