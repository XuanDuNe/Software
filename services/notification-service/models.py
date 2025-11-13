from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from sqlalchemy import UniqueConstraint

class Conversation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    participant1_user_id: int = Field(index=True)
    participant2_user_id: int = Field(index=True)
    application_id: Optional[int] = Field(default=None, index=True) # THAY ĐỔI

    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    messages: list["Message"] = Relationship(back_populates="conversation")
    # THAY ĐỔI: Đảm bảo chỉ có 1 cuộc trò chuyện giữa 2 người dùng cho 1 hồ sơ
    __table_args__ = (
        UniqueConstraint("participant1_user_id", "participant2_user_id", "application_id", name="unique_conversation_per_app"),
    )

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)
    
    sender_user_id: int = Field(index=True)
    receiver_user_id: int = Field(index=True)
    
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = Field(default=None)

    conversation: Optional[Conversation] = Relationship(back_populates="messages")

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True) 
    
    content: str
    read_status: bool = Field(default=False)
    
    type: str = Field(default="general", index=True) 
    
    link_url: Optional[str] = None 
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmailLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    recipient_email: str = Field(index=True)
    subject: str
    
    status: str = Field(default="pending", index=True) 
    
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)