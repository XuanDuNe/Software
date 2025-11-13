from sqlmodel import SQLModel
from typing import Optional


class StudentProfileBase(SQLModel):
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


class StudentProfileRead(StudentProfileBase):
    user_id: int


class StudentProfileUpdate(StudentProfileBase):
    pass


