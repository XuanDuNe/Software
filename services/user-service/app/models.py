from sqlalchemy import Column, Integer, String, Enum
from .database import Base
import enum

class RoleEnum(str, enum.Enum):
    student = "student"
    company = "company"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    role = Column(Enum(RoleEnum))
    description = Column(String)
