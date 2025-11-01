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
