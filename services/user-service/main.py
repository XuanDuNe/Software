from fastapi import FastAPI
from database import create_db_and_tables
from routes import router as user_router

app = FastAPI(title="User Service")

app.include_router(user_router)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/")
def root():
    return {"service": "user-service", "status": "ok"}
