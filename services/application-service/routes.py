from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from .database import get_session
from . import models, schemas

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.post("/", response_model=schemas.ApplicationRead)
def submit_application(
    app_in: schemas.ApplicationCreate, 
    session: Session = Depends(get_session)
):
    # (Thực tế: Cần gọi Opportunity/User service để validate ID)
    
    db_app = models.Application(
        opportunity_id=app_in.opportunity_id,
        student_user_id=app_in.student_user_id,
        provider_user_id=app_in.provider_user_id,
        status=models.ApplicationStatus.PENDING
    )
    
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    
    # Tạo các document
    db_docs = []
    for doc in app_in.documents:
        db_doc = models.ApplicationDocument(
            application_id=db_app.id,
            document_type=doc.document_type,
            document_url=doc.document_url
        )
        session.add(db_doc)
        db_docs.append(db_doc)
    
    session.commit()
    
    # Tạo response
    app_read = schemas.ApplicationRead.from_orm(db_app)
    app_read.documents = [schemas.DocumentRead.from_orm(doc) for doc in db_docs]
    
    return app_read

@router.get("/student/{user_id}", response_model=List[schemas.ApplicationRead])
def get_applications_by_student(user_id: int, session: Session = Depends(get_session)):
    applications = session.exec(
        select(models.Application).where(models.Application.student_user_id == user_id)
    ).all()
    # (Cần join với documents nếu muốn trả về đầy đủ)
    return applications

@router.get("/provider/{user_id}", response_model=List[schemas.ApplicationRead])
def get_applications_by_provider(user_id: int, session: Session = Depends(get_session)):
    applications = session.exec(
        select(models.Application).where(models.Application.provider_user_id == user_id)
    ).all()
    return applications

@router.get("/{app_id}", response_model=schemas.ApplicationRead)
def get_application_details(app_id: int, session: Session = Depends(get_session)):
    db_app = session.get(models.Application, app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Lấy documents
    db_docs = session.exec(
        select(models.ApplicationDocument).where(models.ApplicationDocument.application_id == app_id)
    ).all()

    app_read = schemas.ApplicationRead.from_orm(db_app)
    app_read.documents = [schemas.DocumentRead.from_orm(doc) for doc in db_docs]
    return app_read

@router.patch("/{app_id}/status", response_model=schemas.ApplicationRead)
def update_application_status(
    app_id: int,
    status_in: schemas.ApplicationStatusUpdate,
    session: Session = Depends(get_session)
):
    db_app = session.get(models.Application, app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    db_app.status = status_in.status
    db_app.updated_at = datetime.utcnow()
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    
    return db_app