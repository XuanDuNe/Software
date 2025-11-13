from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class StudentProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, unique=True)
    full_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    gpa: Optional[float] = None
    education_level: Optional[str] = None
    major: Optional[str] = None
    skills: Optional[str] = None
    achievements: Optional[str] = None
    research_interests: Optional[str] = None
    thesis_topic: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


