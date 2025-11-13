from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from database import engine, get_session
from routes import router as api_router
from websocket_manager import manager
from sqlmodel import SQLModel 
from sqlalchemy import text

async def get_user_from_token(token: str):
    if token == "invalid-token":
        return None
    return int(token) 

app = FastAPI(
    title="EduMatch - Notification Service",
    description="Quản lý Chat, Thông báo Real-time (WebSocket) và Email/Push",
    version="1.0"
)

@app.on_event("startup")
def on_startup():
    try:
        with engine.begin() as conn:
            # 1. Thực thi ALTER TABLE để thêm cột application_id (nếu chưa có)
            try:
                conn.execute(text("ALTER TABLE conversation ADD COLUMN application_id INTEGER"))
                conn.execute(text("CREATE INDEX ix_conversation_application_id ON conversation (application_id)"))
                print("Migration: Added application_id column to conversation table.")
            except Exception as e:
                # Bỏ qua lỗi nếu cột đã tồn tại (lỗi thường gặp khi service restart)
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                     print("Migration: application_id column already exists. Skipping.")
                else:
                     # In ra các lỗi khác
                     print(f"Migration Error: {e}")
        SQLModel.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"DB init error: {e}")

app.include_router(api_router)


@app.websocket("/ws/{user_id_or_token}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id_or_token: str
):

    try:
        user_id = int(user_id_or_token)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Kết nối người dùng
    await manager.connect(user_id, websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received data from {user_id}: {data}")
            
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(user_id, websocket)


@app.get("/")
def root():
    return {"service": "notification-service", "status": "ok"}