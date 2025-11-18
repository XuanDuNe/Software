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
    cv_file_id: Optional[str] = None


class StudentProfileRead(StudentProfileBase):
    user_id: int


class StudentProfileUpdate(StudentProfileBase):
    pass

#provider
class ProviderProfileBase(SQLModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None

class ProviderProfileRead(ProviderProfileBase):
    user_id: int

class ProviderProfileUpdate(ProviderProfileBase):
    pass
