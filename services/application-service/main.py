from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from fastapi.staticfiles import StaticFiles
from database import engine 
from routes_application import router as app_router
from sqlmodel import SQLModel
import os

app = FastAPI(
    title="EduMatch - Application Service", 
    description="Quản lý Hồ sơ ứng tuyển (nghiệp vụ của Student).", 
    version="1.0"
)

os.makedirs("static_files/cvs", exist_ok=True)
app.mount("/static", StaticFiles(directory="static_files"), name="static")  

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    try:
        SQLModel.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init error: {e}")

app.include_router(app_router)

@app.get("/")
def root():
    return {"service": "application-service", "status": "ok", "port": 8004}