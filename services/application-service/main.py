from fastapi import FastAPI
from .database import create_db_and_tables
from .routes import router as api_router

app = FastAPI(
    title="EduMatch - Application Service",
    description="Quản lý hồ sơ ứng tuyển và theo dõi trạng thái.",
    version="1.0"
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(api_router)

@app.get("/")
def root():
    return {"service": "application-service", "status": "ok"}