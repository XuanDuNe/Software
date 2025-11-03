from fastapi import FastAPI
from .database import create_db_and_tables
from .routes import router as api_router

app = FastAPI(
    title="EduMatch - Opportunity Service",
    description="Quản lý Học bổng, Chương trình học, Cơ hội nghiên cứu.",
    version="1.0"
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.include_router(api_router)

@app.get("/")
def root():
    return {"service": "opportunity-service", "status": "ok"}