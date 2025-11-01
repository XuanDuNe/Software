from fastapi import FastAPI
from app.database import Base, engine
from app.routers import users

app = FastAPI(title="User Service")
Base.metadata.create_all(bind=engine)
app.include_router(users.router)

@app.get("/")
def root():
    return {"message": "User service running!"}
