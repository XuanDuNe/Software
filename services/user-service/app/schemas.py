from pydantic import BaseModel
from enum import Enum

class RoleEnum(str, Enum):
    student = "student"
    company = "company"
    admin = "admin"

class UserBase(BaseModel):
    email: str
    full_name: str
    role: RoleEnum
    description: str | None = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True
