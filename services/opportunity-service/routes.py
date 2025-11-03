from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from .database import get_session
from . import models, schemas

router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])

def parse_list_to_str(items: Optional[List[str]]) -> Optional[str]:
    return ",".join(items) if items else None

def parse_str_to_list(s: Optional[str]) -> List[str]:
    return s.split(",") if s else []

@router.post("/", response_model=schemas.OpportunityRead)
def create_opportunity(
    opp_in: schemas.OpportunityCreate, 
    session: Session = Depends(get_session)
):
    db_opp = models.Opportunity.from_orm(opp_in)
    session.add(db_opp)
    session.commit()
    session.refresh(db_opp)
    return db_opp

@router.get("/", response_model=List[schemas.OpportunityRead])
def get_all_opportunities(session: Session = Depends(get_session)):
    return session.exec(select(models.Opportunity)).all()

@router.get("/{opp_id}", response_model=schemas.OpportunityReadWithCriteria)
def get_opportunity(opp_id: int, session: Session = Depends(get_session)):
    opp = session.get(models.Opportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    criteria = session.exec(
        select(models.Criteria).where(models.Criteria.opportunity_id == opp_id)
    ).first()

    criteria_read = None
    if criteria:
        criteria_read = schemas.CriteriaRead(
            id=criteria.id,
            opportunity_id=criteria.opportunity_id,
            gpa_min=criteria.gpa_min,
            skills=parse_str_to_list(criteria.skills),
            deadline=criteria.deadline,
            required_documents=parse_str_to_list(criteria.required_documents)
        )
    
    opp_read = schemas.OpportunityRead.from_orm(opp)
    return schemas.OpportunityReadWithCriteria(**opp_read.dict(), criteria=criteria_read)


@router.post("/{opp_id}/criteria", response_model=schemas.CriteriaRead)
def create_or_update_criteria(
    opp_id: int, 
    criteria_in: schemas.CriteriaCreate, 
    session: Session = Depends(get_session)
):
    opp = session.get(models.Opportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    db_criteria = session.exec(
        select(models.Criteria).where(models.Criteria.opportunity_id == opp_id)
    ).first()
    
    skills_str = parse_list_to_str(criteria_in.skills)
    docs_str = parse_list_to_str(criteria_in.required_documents)

    if db_criteria:
        db_criteria.gpa_min = criteria_in.gpa_min
        db_criteria.skills = skills_str
        db_criteria.deadline = criteria_in.deadline
        db_criteria.required_documents = docs_str
    else:
        db_criteria = models.Criteria(
            opportunity_id=opp_id,
            gpa_min=criteria_in.gpa_min,
            skills=skills_str,
            deadline=criteria_in.deadline,
            required_documents=docs_str
        )
    
    session.add(db_criteria)
    session.commit()
    session.refresh(db_criteria)
    
    return schemas.CriteriaRead(
        id=db_criteria.id,
        opportunity_id=db_criteria.opportunity_id,
        gpa_min=db_criteria.gpa_min,
        skills=parse_str_to_list(db_criteria.skills),
        deadline=db_criteria.deadline,
        required_documents=parse_str_to_list(db_criteria.required_documents)
    )