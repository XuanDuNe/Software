from sqlmodel import SQLModel
from typing import Optional, List
from datetime import datetime
from .models import OpportunityType

class OpportunityBase(SQLModel):
    provider_user_id: int
    title: str
    description: str
    type: OpportunityType

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityRead(OpportunityBase):
    id: int
    created_at: datetime

class OpportunityUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None

class CriteriaBase(SQLModel):
    gpa_min: Optional[float] = None
    skills: Optional[List[str]] = []
    deadline: Optional[datetime] = None
    required_documents: Optional[List[str]] = []

class CriteriaCreate(CriteriaBase):
    pass

class CriteriaRead(CriteriaBase):
    id: int
    opportunity_id: int

class CriteriaUpdate(CriteriaBase):
    pass

class OpportunityReadWithCriteria(OpportunityRead):
    criteria: Optional[CriteriaRead] = None