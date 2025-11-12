# services/provider-service/schemas.py
from sqlmodel import SQLModel
from typing import Optional, List
from datetime import datetime
import enum

# --- Enums (sao chép từ application-service/models.py) ---
class OpportunityType(str, enum.Enum):
    SCHOLARSHIP = "scholarship"
    RESEARCH_LAB = "research_lab"
    PROGRAM = "program"

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    VIEWED = "viewed"
    INTERVIEW = "interview"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

# --- Opportunity Schemas (chuyển từ application-service/schemas.py) ---
class OpportunityBase(SQLModel):
    provider_user_id: int
    title: str
    description: str
    type: OpportunityType

class OpportunityCreate(OpportunityBase): pass
class OpportunityRead(OpportunityBase):
    id: int
    created_at: datetime
class OpportunityUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[OpportunityType] = None

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

# --- Application Schemas (chuyển các phần Provider cần) ---
# Đây là các schema mà service này cần để giao tiếp với application-service
# hoặc để trả về dữ liệu cho provider

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