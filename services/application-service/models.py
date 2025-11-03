from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import enum

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"     
    VIEWED = "viewed"       
    INTERVIEW = "interview" 
    ACCEPTED = "accepted"   
    REJECTED = "rejected"   

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    opportunity_id: int = Field(index=True) 
    student_user_id: int = Field(index=True)  
    provider_user_id: int = Field(index=True) 
    
    status: ApplicationStatus = Field(default=ApplicationStatus.PENDING, index=True)
    
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    

    documents: List["ApplicationDocument"] = Relationship(back_populates="application")

class ApplicationDocument(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(foreign_key="application.id", index=True)
    
    document_type: str = Field(index=True) 
    
    application: Optional[Application] = Relationship(back_populates="documents")