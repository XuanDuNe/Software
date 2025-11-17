from fastapi import FastAPI
from database import engine
from routes import router as provider_router
from sqlmodel import SQLModel 
from sqlalchemy import text

app = FastAPI(
    title="EduMatch - Provider Service",
    description="Quản lý Cơ hội (Opportunities) và các nghiệp vụ của Provider.",
    version="1.0"
)

@app.on_event("startup")
def on_startup():
    try:

        with engine.begin() as conn:
            try:
                conn.execute(text("ALTER TABLE opportunity ADD COLUMN status VARCHAR(255) DEFAULT 'open'"))
                print("Migration: Added status column to opportunity table.")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                     print("Migration: status column already exists. Skipping.")
                else:
                     print(f"Migration Error (non-critical): {e}") 
        
        SQLModel.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init error: {e}")

app.include_router(provider_router)

@app.get("/")
def root():
    return {"service": "provider-service", "status": "ok", "port": 8006}