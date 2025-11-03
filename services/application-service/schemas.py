from sqlmodel import SQLModel
from typing import Optional, List
from datetime import datetime
from .models import ApplicationStatus

class DocumentBase(SQLModel):
    document_type: str
    document_url: str

class DocumentCreate(DocumentBase):
    pass

class DocumentRead(DocumentBase):
    id: int
    application_id: int

class ApplicationBase(SQLModel):
    opportunity_id: int
    student_user_id: int
    provider_user_id: int

class ApplicationCreate(ApplicationBase):
    documents: List[DocumentCreate] = []

class ApplicationRead(ApplicationBase):
    id: int
    status: ApplicationStatus
    submitted_at: datetime
    updated_at: datetime
    documents: List[DocumentRead] = []

class ApplicationStatusUpdate(SQLModel):
    status: ApplicationStatus