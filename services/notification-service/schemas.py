from sqlmodel import SQLModel
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConversationRead(SQLModel):
    id: int
    participant1_user_id: int
    participant2_user_id: int
    application_id: Optional[int] # THAY ĐỔI: Thêm application_id
    created_at: datetime

class MessageRead(SQLModel):
    id: int
    conversation_id: int
    sender_user_id: int
    receiver_user_id: int
    content: str
    created_at: datetime
    read_at: Optional[datetime]

class NotificationRead(SQLModel):
    id: int
    user_id: int
    content: str
    read_status: bool
    type: str
    link_url: Optional[str]
    created_at: datetime

class ConversationCreate(BaseModel):
    participant1_user_id: int
    participant2_user_id: int
    application_id: Optional[int] = None # THAY ĐỔI: Thêm application_id

class MessageCreate(BaseModel):
    conversation_id: int
    sender_user_id: int
    receiver_user_id: int
    content: str

class NotificationCreate(BaseModel):
    user_id: int 
    content: str
    type: str
    link_url: Optional[str] = None

class EmailSendSchema(BaseModel):
    recipient_email: str
    subject: str
    body: str 