from urllib import response
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from database import get_session
import models, schemas
import httpx
import os
import asyncio

APPLICATION_SERVICE_URL = os.getenv("APPLICATION_SERVICE_URL", "http://application-service:8004")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8005")
USER_SERVICE_URL = os.getenv("USER_SERVICE_URL", "http://user-service:8002")

router = APIRouter(prefix="/api", tags=["Provider Service"])

def parse_list_to_str(items: Optional[List[str]]) -> Optional[str]:
    return ",".join(items) if items else None

def parse_str_to_list(s: Optional[str]) -> List[str]:
    return [item for item in s.split(",") if item] if s else []

def _upsert_criteria(session: Session, opportunity_id: int, criteria_in: Optional[schemas.CriteriaCreate]):
    if not criteria_in:
        return None

    db_criteria = session.exec(
        select(models.Criteria).where(models.Criteria.opportunity_id == opportunity_id)
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
            opportunity_id=opportunity_id,
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

async def get_unread_status_for_app(student_user_id: int, provider_user_id: int, application_id: int, user_to_check: int) -> bool:
    """
    Tạo conversation (nếu chưa có) và kiểm tra số lượng tin nhắn chưa đọc.
    Trả về True nếu có tin nhắn chưa đọc cho user_to_check.
    """
    try:
        async with httpx.AsyncClient() as client:
            convo_resp = await client.post(
                f"{NOTIFICATION_SERVICE_URL}/api/conversations",
                json={
                    "participant1_user_id": student_user_id,
                    "participant2_user_id": provider_user_id,
                    "application_id": application_id
                }
            )
            convo_resp.raise_for_status()
            conversation = convo_resp.json()
            conversation_id = conversation.get("id")

            if not conversation_id:
                return False

            unread_resp = await client.get(
                f"{NOTIFICATION_SERVICE_URL}/api/conversations/{conversation_id}/unread_count/{user_to_check}"
            )
            unread_resp.raise_for_status()
            unread_data = unread_resp.json()

            return unread_data.get("count", 0) > 0

    except Exception as e:
        print(f"Error checking unread status for app {application_id} (user {user_to_check}): {e}")
        return False

@router.post("/opportunities/", response_model=schemas.OpportunityReadWithCriteria)
def create_opportunity(
    opp_in: schemas.OpportunityCreate,
    session: Session = Depends(get_session)
):
    try:
        base_payload = opp_in.dict(exclude={"criteria"})
        if isinstance(base_payload.get("type"), str):
            try:
                base_payload["type"] = models.OpportunityType(base_payload["type"])
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid opportunity type")
        
        if "status" in base_payload:
             if isinstance(base_payload["status"], str):
                 try:
                     base_payload["status"] = models.OpportunityStatus(base_payload["status"])
                 except Exception:
                     raise HTTPException(status_code=400, detail="Invalid opportunity status")
        else:
             base_payload["status"] = models.OpportunityStatus.OPEN

        if not base_payload.get("title") or not base_payload.get("description"):
            raise HTTPException(status_code=400, detail="Title and description are required")
        if not isinstance(base_payload.get("provider_user_id"), int):
            raise HTTPException(status_code=400, detail="provider_user_id must be an integer")

        db_opp = models.Opportunity(**base_payload)
        session.add(db_opp)
        session.commit()
        session.refresh(db_opp)

        criteria_read = _upsert_criteria(session, db_opp.id, opp_in.criteria)

        opp_read = schemas.OpportunityRead.from_orm(db_opp)
        return schemas.OpportunityReadWithCriteria(**opp_read.dict(), criteria=criteria_read)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Create opportunity failed: {str(e)}")

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
        opp_read = schemas.OpportunityRead.from_orm(opp)
        opp_with_criteria = schemas.OpportunityReadWithCriteria(
            **opp_read.dict(),
            criteria=criteria_read
        )
        results.append(opp_with_criteria)

    return results

@router.get("/opportunities/{opp_id}", response_model=schemas.OpportunityReadWithCriteria)
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
    return schemas.OpportunityReadWithCriteria(
        **opp_read.dict(),
        criteria=criteria_read
    )

@router.put("/opportunities/{opp_id}", response_model=schemas.OpportunityReadWithCriteria)
def update_opportunity(
    opp_id: int,
    opp_in: schemas.OpportunityUpdate,
    session: Session = Depends(get_session)
):
    db_opp = session.get(models.Opportunity, opp_id)
    if not db_opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp_data = opp_in.dict(exclude_unset=True, exclude={"criteria"})
    if "type" in opp_data and isinstance(opp_data["type"], str):
        opp_data["type"] = models.OpportunityType(opp_data["type"])
    
    if "status" in opp_data and isinstance(opp_data["status"], str):
         opp_data["status"] = models.OpportunityStatus(opp_data["status"]) 

    for key, value in opp_data.items():
        setattr(db_opp, key, value)
    session.add(db_opp)
    session.commit()
    session.refresh(db_opp)

    criteria_read = _upsert_criteria(session, db_opp.id, opp_in.criteria)
    opp_read = schemas.OpportunityRead.from_orm(db_opp)
    return schemas.OpportunityReadWithCriteria(**opp_read.dict(), criteria=criteria_read)

@router.patch("/opportunities/{opp_id}/status", response_model=schemas.OpportunityRead)
def update_opportunity_status(
    opp_id: int,
    status_in: schemas.OpportunityStatusUpdate,
    session: Session = Depends(get_session)
):
    """Cập nhật trạng thái Mở/Đóng cho Cơ hội."""
    db_opp = session.get(models.Opportunity, opp_id)
    if not db_opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    # Check if the status is valid
    try:
        new_status = models.OpportunityStatus(status_in.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value")
    
    db_opp.status = new_status
    session.add(db_opp)
    session.commit()
    session.refresh(db_opp)
    
    return db_opp

@router.delete("/opportunities/{opp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_opportunity(opp_id: int, session: Session = Depends(get_session)):
    """
    Xóa một cơ hội.
    """
    db_opp = session.get(models.Opportunity, opp_id)
    if not db_opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    try:
        session.delete(db_opp)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Không thể xóa cơ hội vì có dữ liệu liên quan: {str(e)}"
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)

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


async def notify_user(user_id: int, content: str, link_url: Optional[str] = None):
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
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error calling Application Service: {e}")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())


@router.get("/applications/provider/{user_id}/enriched")
async def get_applications_by_provider_enriched(user_id: int):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{APPLICATION_SERVICE_URL}/api/applications/provider/{user_id}")
            response.raise_for_status()
            applications = response.json() or []

            tasks = []
            for app in applications:
                student_id = app.get("student_user_id")
                
                if student_id is not None:
                    profile_coro = client.get(f"{USER_SERVICE_URL}/api/student/profile/{student_id}")
                    
                    unread_coro_provider = get_unread_status_for_app(
                        student_user_id=student_id,
                        provider_user_id=user_id,
                        application_id=app.get("id"),
                        user_to_check=user_id # Kiểm tra tin nhắn chưa đọc cho Provider
                    )
                    
                    tasks.append((app, profile_coro, unread_coro_provider))
            
            
            results = await asyncio.gather(*[
                asyncio.gather(task[1], task[2], return_exceptions=True) 
                for task in tasks
            ])
            
            enriched = []
            for i, result in enumerate(results):
                app = tasks[i][0]
                profile_resp, has_unread_messages = result
                
                profile = None
                if not isinstance(profile_resp, Exception) and profile_resp.status_code == 200:
                    profile = profile_resp.json()
                
                if isinstance(has_unread_messages, Exception):
                    has_unread_messages = False

                enriched.append({
                    **app,
                    "student_profile": profile,
                    "has_unread_messages": has_unread_messages, # NEW FIELD
                })

            return enriched
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Error calling downstream services: {e}")
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
             return []
        raise HTTPException(status_code=e.response.status_code, detail=e.response.json())


@router.patch("/applications/{app_id}/status", response_model=schemas.ApplicationRead)
async def update_application_status(
    app_id: int,
    status_in: schemas.ApplicationStatusUpdate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """
    Provider cập nhật trạng thái hồ sơ (gọi sang Application Service).
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{APPLICATION_SERVICE_URL}/api/applications/{app_id}/status",
                json={"status": status_in.status.value}
            )
            response.raise_for_status()
            updated_app = response.json()
            db_opp = session.get(models.Opportunity, updated_app.get("opportunity_id"))

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