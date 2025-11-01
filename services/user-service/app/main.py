from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # thêm dòng này
from app.database import Base, engine
from app.routers import users

app = FastAPI(title="User Service")

# ✅ Bật CORS cho phép frontend gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # cho phép mọi origin (HTML test)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Tạo bảng trong database nếu chưa có
Base.metadata.create_all(bind=engine)

# ✅ Gắn router users
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "User service running!"}
