from typing import List
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

    class Config:
        from_attributes = True  # Pydantic v2
        

class TokenVerify(BaseModel):
    token: str


class UserPublic(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_verified: bool

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: str


class UserListResponse(BaseModel):
    total: int
    users: List[UserPublic]


class OTPRequest(BaseModel):
    email: EmailStr
    role: str  # student or provider


class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str
    password: str
    role: str