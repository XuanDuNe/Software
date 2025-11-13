from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from database import engine
from routes import router


app = FastAPI(title="EduMatch - User Service", version="1.0")

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


app.include_router(router)


@app.get("/")
def root():
    return {"service": "user-service", "status": "ok", "port": 8002}


