# services/application-service/routes_application.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from database import get_session
import models, schemas
import httpx 

# URL của các service khác
PROVIDER_SERVICE_URL = "http://provider-service:8006" # Port 8006 mới
NOTIFICATION_SERVICE_URL = "http://notification-service:8005"

router = APIRouter(prefix="/api/applications", tags=["Applications"])

# --- Hàm gọi sang Notification Service (Giữ lại) ---
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

# --- Application CRUD (Refactored) ---

@router.post("/", response_model=schemas.ApplicationRead)
async def submit_application(
    app_in: schemas.ApplicationCreate, 
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """
    Sinh viên nộp hồ sơ (ĐÃ REFACTOR).
    """
    
    # 1. Gọi Provider-service để lấy thông tin Opportunity
    opp_data = None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PROVIDER_SERVICE_URL}/api/opportunities/{app_in.opportunity_id}")
            response.raise_for_status()
            opp_data = response.json()
    except (httpx.RequestError, httpx.HTTPStatusError):
        raise HTTPException(status_code=404, detail="Opportunity not found")

    provider_user_id = opp_data.get("provider_user_id")
    opp_title = opp_data.get("title", "Không rõ")

    # 2. Kiểm tra hồ sơ đã tồn tại
    existing = session.exec(
        select(models.Application)
        .where(models.Application.student_user_id == app_in.student_user_id)
        .where(models.Application.opportunity_id == app_in.opportunity_id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Application already submitted")
    
    # 3. Tạo Application (với provider_user_id tra cứu được)
    db_app = models.Application(
        opportunity_id=app_in.opportunity_id,
        student_user_id=app_in.student_user_id,
        provider_user_id=provider_user_id, # Lấy từ provider-service
        status=models.ApplicationStatus.PENDING
    )
    
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    
    # ... (Lưu documents, giữ nguyên)
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
    
    # 4. Gửi thông báo cho Provider (giữ nguyên)
    background_tasks.add_task(
        notify_user,
        user_id=provider_user_id,
        content=f"Bạn có hồ sơ ứng tuyển mới cho cơ hội '{opp_title}'.",
        link_url=f"/provider/application/{db_app.id}"
    )
    
    app_read = schemas.ApplicationRead.from_orm(db_app)
    app_read.documents = [schemas.DocumentRead.from_orm(doc) for doc in db_docs]
    
    return app_read

@router.get("/student/{user_id}", response_model=List[schemas.ApplicationReadDetail])
async def get_applications_by_student(user_id: int, session: Session = Depends(get_session)):
    """
    Lấy tất cả hồ sơ ứng tuyển của một sinh viên (ĐÃ REFACTOR).
    """
    applications = session.exec(
        select(models.Application).where(models.Application.student_user_id == user_id)
    ).all()
    
    results = []
    async with httpx.AsyncClient() as client:
        for app in applications:
            opp_data = None
            try:
                # Gọi provider-service để lấy thông tin opp
                response = await client.get(f"{PROVIDER_SERVICE_URL}/api/opportunities/{app.opportunity_id}")
                if response.status_code == 200:
                    opp_data = response.json()
            except httpx.RequestError:
                pass # Bỏ qua nếu không lấy được opp
                
            app_read = schemas.ApplicationRead.from_orm(app)
            results.append(schemas.ApplicationReadDetail(
                **app_read.dict(),
                opportunity=schemas.OpportunityRead.parse_obj(opp_data) if opp_data else None
            ))
    return results

# === ENDPOINT NỘI BỘ (Cho provider-service gọi) ===

@router.get("/provider/{user_id}", response_model=List[schemas.ApplicationRead])
def get_applications_by_provider_internal(user_id: int, session: Session = Depends(get_session)):
    """
    (Nội bộ) Lấy tất cả hồ sơ mà một provider nhận được.
    """
    applications = session.exec(
        select(models.Application).where(models.Application.provider_user_id == user_id)
    ).all()
    return applications

@router.get("/{app_id}", response_model=schemas.ApplicationRead)
def get_application_details_internal(app_id: int, session: Session = Depends(get_session)):
    """
    (Nội bộ) Lấy chi tiết một hồ sơ ứng tuyển (kèm tài liệu).
    """
    db_app = session.get(models.Application, app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")

    db_docs = session.exec(
        select(models.ApplicationDocument).where(models.ApplicationDocument.application_id == app_id)
    ).all()

    app_read = schemas.ApplicationRead.from_orm(db_app)
    app_read.documents = [schemas.DocumentRead.from_orm(doc) for doc in db_docs]
    return app_read

@router.patch("/{app_id}/status", response_model=schemas.ApplicationRead)
async def update_application_status_internal(
    app_id: int,
    status_in: schemas.ApplicationStatusUpdate,
    session: Session = Depends(get_session)
):
    """
    (Nội bộ) Cập nhật trạng thái hồ sơ.
    (Hàm này không cần gửi thông báo, vì provider-service sẽ gửi)
    """
    db_app = session.get(models.Application, app_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    db_app.status = status_in.status
    db_app.updated_at = datetime.utcnow()
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    return db_app