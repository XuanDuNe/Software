from typing import Optional, List
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    full_name: Optional[str]

class UserRead(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str]

    class Config:
        orm_mode = True

class StudentProfileCreate(BaseModel):
    user_id: int
    gpa: Optional[float]
    skills: Optional[List[str]] = []
    interests: Optional[List[str]] = []
    cv_url: Optional[str]

class StudentProfileUpdate(BaseModel):
    gpa: Optional[float]
    skills: Optional[List[str]]
    interests: Optional[List[str]]
    cv_url: Optional[str]

class StudentProfileRead(BaseModel):
    id: int
    user_id: int
    gpa: Optional[float]
    skills: Optional[List[str]]
    interests: Optional[List[str]]
    cv_url: Optional[str]

    class Config:
        orm_mode = True

class ProviderProfileCreate(BaseModel):
    user_id: int
    organization: Optional[str]
    country: Optional[str]

class ProviderProfileRead(BaseModel):
    id: int
    user_id: int
    organization: Optional[str]
    country: Optional[str]

    class Config:
        orm_mode = True

class SavedOpportunityRead(BaseModel):
    id: int
    user_id: int
    opportunity_id: str

    class Config:
        orm_mode = True
