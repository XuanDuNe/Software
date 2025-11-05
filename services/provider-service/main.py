from fastapi import FastAPI
from database import engine
from routes import router as provider_router
from sqlmodel import SQLModel 

app = FastAPI(
    title="EduMatch - Provider Service",
    description="Quản lý Cơ hội (Opportunities) và các nghiệp vụ của Provider.",
    version="1.0"
)

@app.on_event("startup")
def on_startup():
    try:
        SQLModel.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init error: {e}")

app.include_router(provider_router)

@app.get("/")
def root():
    return {"service": "provider-service", "status": "ok", "port": 8006}