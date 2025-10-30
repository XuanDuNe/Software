from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        """Chấp nhận kết nối WebSocket mới và lưu trữ nó."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: int, websocket: WebSocket):
        """Xóa kết nối WebSocket khi người dùng ngắt kết nối."""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: int):
        """Gửi một tin nhắn JSON (chat hoặc thông báo) đến một user_id cụ thể."""
        message_str = json.dumps(message, default=str) 
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message_str)
                except Exception as e:
                    print(f"Error sending to user {user_id}: {e}")
                    self.active_connections[user_id].remove(connection)


manager = ConnectionManager()