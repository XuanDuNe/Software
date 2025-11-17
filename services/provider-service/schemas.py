from sqlmodel import SQLModel
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

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    VIEWED = "viewed"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class OpportunityBase(SQLModel):
    provider_user_id: int
    title: str
    description: str
    type: OpportunityType

class OpportunityCreate(OpportunityBase):
    criteria: Optional["CriteriaCreate"] = None


class OpportunityRead(OpportunityBase):
    id: int
    status: Optional[OpportunityStatus]
    created_at: datetime


class OpportunityUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[OpportunityType] = None
    criteria: Optional["CriteriaCreate"] = None
    type: Optional[OpportunityType] = None
    status: Optional[OpportunityStatus] = None

class OpportunityStatusUpdate(SQLModel):
    status: OpportunityStatus

class CriteriaBase(SQLModel):
    gpa_min: Optional[float] = None
    skills: Optional[List[str]] = []
    deadline: Optional[datetime] = None
    required_documents: Optional[List[str]] = []

class CriteriaCreate(CriteriaBase): pass
class CriteriaRead(CriteriaBase):
    id: int
    opportunity_id: int
class CriteriaUpdate(CriteriaBase): pass

class OpportunityReadWithCriteria(OpportunityRead):
    criteria: Optional[CriteriaRead] = None


OpportunityCreate.update_forward_refs()
OpportunityUpdate.update_forward_refs()
OpportunityReadWithCriteria.update_forward_refs()

class DocumentRead(SQLModel):
    id: int
    application_id: int
    document_type: str
    document_url: str

class ApplicationRead(SQLModel):
    id: int
    opportunity_id: int
    student_user_id: int
    provider_user_id: int
    status: ApplicationStatus
    submitted_at: datetime
    updated_at: datetime
    documents: List[DocumentRead] = []

class ApplicationStatusUpdate(SQLModel):
    status: ApplicationStatus