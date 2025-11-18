from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import enum

class OpportunityType(str, enum.Enum):
    SCHOLARSHIP = "scholarship"
    RESEARCH_LAB = "research_lab"
    PROGRAM = "program"

class OpportunityStatus(str, enum.Enum): 
    OPEN = "open"
    CLOSED = "closed"


class OpportunityApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class Opportunity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    provider_user_id: int = Field(index=True)
    title: str = Field(index=True)
    description: str
    type: OpportunityType = Field(default=OpportunityType.SCHOLARSHIP)
    status: Optional[OpportunityStatus] = Field(default=OpportunityStatus.OPEN)
    approval_status: OpportunityApprovalStatus = Field(default=OpportunityApprovalStatus.PENDING, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    criteria: Optional["Criteria"] = Relationship(back_populates="opportunity", sa_relationship_kwargs={"uselist": False})

class Criteria(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    opportunity_id: int = Field(foreign_key="opportunity.id", index=True, unique=True)
    gpa_min: Optional[float] = None
    skills: Optional[str] = None 
    deadline: Optional[datetime] = None
    required_documents: Optional[str] = None 
    
    opportunity: Optional[Opportunity] = Relationship(back_populates="criteria")