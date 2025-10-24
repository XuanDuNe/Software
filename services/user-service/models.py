from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, unique=True)
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    student_profile: Optional["StudentProfile"] = Relationship(back_populates="user")
    provider_profile: Optional["ProviderProfile"] = Relationship(back_populates="user")
    saved_opportunities: List["SavedOpportunity"] = Relationship(back_populates="user")


class StudentProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    gpa: Optional[float] = None
    skills: Optional[str] = None   # comma-separated or JSON string
    interests: Optional[str] = None
    cv_url: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="student_profile")


class ProviderProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    organization: Optional[str] = None
    country: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="provider_profile")


class SavedOpportunity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    opportunity_id: str = Field(index=True)   # could be UUID or string id from opportunity-service
    saved_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional[User] = Relationship(back_populates="saved_opportunities")
