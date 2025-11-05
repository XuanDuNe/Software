from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from database import get_session
import models, schemas

router = APIRouter(prefix="/api/opportunities", tags=["Opportunities"])

# --- Helpers ---
def parse_list_to_str(items: Optional[List[str]]) -> Optional[str]:
    """Chuyển đổi list ['a', 'b'] thành string "a,b"."""
    return ",".join(items) if items else None

def parse_str_to_list(s: Optional[str]) -> List[str]:
    """Chuyển đổi string "a,b" thành list ['a', 'b'] hoặc [] nếu rỗng."""
    return [item for item in s.split(",") if item] if s else []

# --- Opportunity CRUD ---

@router.post("/", response_model=schemas.OpportunityRead)
def create_opportunity(
    opp_in: schemas.OpportunityCreate, 
    session: Session = Depends(get_session)
):
    """
    Tạo một cơ hội mới (học bổng, phòng lab...).
    (Cần xác thực provider_user_id này là provider)
    """
    db_opp = models.Opportunity.from_orm(opp_in)
    session.add(db_opp)
    session.commit()
    session.refresh(db_opp)
    return db_opp

@router.get("/", response_model=List[schemas.OpportunityReadWithCriteria])
def get_all_opportunities(session: Session = Depends(get_session)):
    """
    Lấy danh sách tất cả các cơ hội, kèm theo tiêu chí.
    """
    opportunities = session.exec(select(models.Opportunity)).all()
    results = []
    
    for opp in opportunities:
        criteria = session.exec(
            select(models.Criteria).where(models.Criteria.opportunity_id == opp.id)
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
        results.append(schemas.OpportunityReadWithCriteria(**opp_read.dict(), criteria=criteria_read))
        
    return results

@router.get("/{opp_id}", response_model=schemas.OpportunityReadWithCriteria)
def get_opportunity(opp_id: int, session: Session = Depends(get_session)):
    """
    Lấy thông tin chi tiết của một cơ hội theo ID, kèm tiêu chí.
    """
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

@router.put("/{opp_id}", response_model=schemas.OpportunityRead)
def update_opportunity(
    opp_id: int,
    opp_in: schemas.OpportunityUpdate,
    session: Session = Depends(get_session)
):
    """
    Cập nhật thông tin cơ bản của cơ hội (title, description).
    """
    db_opp = session.get(models.Opportunity, opp_id)
    if not db_opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opp_data = opp_in.dict(exclude_unset=True)
    for key, value in opp_data.items():
        setattr(db_opp, key, value)
        
    session.add(db_opp)
    session.commit()
    session.refresh(db_opp)
    return db_opp

# --- Criteria CRUD ---

@router.post("/{opp_id}/criteria", response_model=schemas.CriteriaRead)
def create_or_update_criteria(
    opp_id: int, 
    criteria_in: schemas.CriteriaCreate, 
    session: Session = Depends(get_session)
):
    """
    Tạo hoặc cập nhật tiêu chí (criteria) cho một cơ hội.
    Nếu đã tồn tại, sẽ ghi đè.
    """
    opp = session.get(models.Opportunity, opp_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    db_criteria = session.exec(
        select(models.Criteria).where(models.Criteria.opportunity_id == opp_id)
    ).first()
    
    skills_str = parse_list_to_str(criteria_in.skills)
    docs_str = parse_list_to_str(criteria_in.required_documents)

    if db_criteria:
        # Update
        db_criteria.gpa_min = criteria_in.gpa_min
        db_criteria.skills = skills_str
        db_criteria.deadline = criteria_in.deadline
        db_criteria.required_documents = docs_str
    else:
        # Create
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
    
    # Trả về Pydantic model đã parse
    return schemas.CriteriaRead(
        id=db_criteria.id,
        opportunity_id=db_criteria.opportunity_id,
        gpa_min=db_criteria.gpa_min,
        skills=parse_str_to_list(db_criteria.skills),
        deadline=db_criteria.deadline,
        required_documents=parse_str_to_list(db_criteria.required_documents)
    )