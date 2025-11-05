# services/provider-service/routes.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from database import get_session
import models, schemas
import httpx 

# URL của các service khác
APPLICATION_SERVICE_URL = "http://application-service:8004"
NOTIFICATION_SERVICE_URL = "http://notification-service:8005"

router = APIRouter(prefix="/api", tags=["Provider Service"])

# --- Helpers (Copy từ routes_opportunity.py) ---
def parse_list_to_str(items: Optional[List[str]]) -> Optional[str]:
    return ",".join(items) if items else None

def parse_str_to_list(s: Optional[str]) -> List[str]:
    return [item for item in s.split(",") if item] if s else []

# === OPPORTUNITY ROUTES (Chuyển từ routes_opportunity.py) ===

@router.post("/opportunities/", response_model=schemas.OpportunityRead)
def create_opportunity(
    opp_in: schemas.OpportunityCreate, 
    session: Session = Depends(get_session)
):
    db_opp = models.Opportunity.from_orm(opp_in)
    session.add(db_opp)
    session.commit()
    session.refresh(db_opp)
    return db_opp

@router.get("/opportunities/", response_model=List[schemas.OpportunityReadWithCriteria])
def get_all_opportunities(session: Session = Depends(get_session)):
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
        
        # --- SỬA Ở ĐÂY ---
        # 1. Tạo đối tượng từ ORM
        opp_with_criteria = schemas.OpportunityReadWithCriteria.from_orm(opp)
        # 2. Gán trường criteria đã xử lý
        opp_with_criteria.criteria = criteria_read
        results.append(opp_with_criteria)
        # --- KẾT THÚC SỬA ---

    return results

@router.get("/opportunities/{opp_id}", response_model=schemas.OpportunityReadWithCriteria)
def get_opportunity(opp_id: int, session: Session = Depends(get_session)):
    # Endpoint này sẽ được application-service gọi nội bộ
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
    
    # --- SỬA Ở ĐÂY ---
    # 1. Tạo đối tượng từ ORM
    opp_with_criteria = schemas.OpportunityReadWithCriteria.from_orm(opp)
    # 2. Gán trường criteria đã xử lý
    opp_with_criteria.criteria = criteria_read
    return opp_with_criteria
    # --- KẾT THÚC SỬA ---

@router.put("/opportunities/{opp_id}", response_model=schemas.OpportunityRead)
def update_opportunity(
    opp_id: int,
    opp_in: schemas.OpportunityUpdate,
    session: Session = Depends(get_session)
):
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

@router.post("/opportunities/{opp_id}/criteria", response_model=schemas.CriteriaRead)
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

# === APPLICATION MANAGEMENT ROUTES (Chuyển từ routes_application.py) ===

async def notify_user(user_id: int, content: str, link_url: Optional[str] = None):
    # Hàm này gọi sang notification-service
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/notifications",
                json={
                    "user_id": user_id,
                    "content": content,
                    "type": "application_update",
                    "link_url": link_url
                }
            )
    except Exception as e:
        print(f"Failed to send notification to user {user_id}: {e}")

@router.get("/applications/provider/{user_id}", response_model=List[schemas.ApplicationRead])
async def get_applications_by_provider(user_id: int):
    """
    Lấy tất cả hồ sơ ứng tuyển mà một provider nhận được (gọi sang Application Service).
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{APPLICATION_SERVICE_URL}/api/applications/provider/{user_id}")
            response.raise_for_status() # Ném lỗi nếu status code là 4xx hoặc 5xx
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error calling Application Service: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())


@router.patch("/applications/{app_id}/status", response_model=schemas.ApplicationRead)
async def update_application_status(
    app_id: int,
    status_in: schemas.ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session) # Cần session để lấy Opp
):
    """
    Provider cập nhật trạng thái hồ sơ (gọi sang Application Service).
    """
    try:
        # 1. Gọi sang Application Service để cập nhật trạng thái
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{APPLICATION_SERVICE_URL}/api/applications/{app_id}/status",
                json={"status": status_in.status.value}
            )
            response.raise_for_status()
            updated_app = response.json()
            
            # 2. Lấy thông tin Opportunity (từ DB của service này) để gửi thông báo
            db_opp = session.get(models.Opportunity, updated_app.get("opportunity_id"))
            
            # 3. Gửi thông báo cho sinh viên
            if db_opp:
                background_tasks.add_task(
                    notify_user,
                    user_id=updated_app.get("student_user_id"),
                    content=f"Trạng thái hồ sơ của bạn cho '{db_opp.title}' đã được cập nhật: {status_in.status.value}",
                    link_url=f"/student/application/{app_id}"
                )
            
            return updated_app
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error calling Application Service: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())