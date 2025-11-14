# services/application-service/routes_application.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form, Request 
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from database import get_session
import models, schemas
import httpx 
import os
import shutil
import asyncio

# URL của các service khác
PROVIDER_SERVICE_URL = "http://provider-service:8006" # Port 8006 mới
NOTIFICATION_SERVICE_URL = "http://notification-service:8005"
UPLOAD_DIR = "static_files/cvs"

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
    request: Request, # <--- CHỈ GIỮ LẠI Request để đọc toàn bộ body
    background_tasks: BackgroundTasks, 
    session: Session = Depends(get_session), 
):
    """
    Sinh viên nộp hồ sơ. Endpoint này nhận dữ liệu qua multipart/form-data.
    Đọc tất cả dữ liệu từ request.form() để tránh lỗi parsing.
    """
    
    # 1. Truy cập Form data thô (Đọc hết mọi thứ từ form_data)
    try:
        form_data = await request.form()
        opportunity_id_str = form_data.get("opportunity_id")
        student_user_id_str = form_data.get("student_user_id")
        cv_file: UploadFile = form_data.get("cv_file") # <--- Lấy file trực tiếp từ form_data
        
        # Kiểm tra sự tồn tại (bao gồm cả file)
        if not opportunity_id_str or not student_user_id_str or not cv_file:
             # Trả về lỗi 422 chi tiết hơn
             missing_fields = []
             if not opportunity_id_str: missing_fields.append("opportunity_id")
             if not student_user_id_str: missing_fields.append("student_user_id")
             if not cv_file: missing_fields.append("cv_file")
             
             raise HTTPException(
                status_code=422, 
                detail=f"Các trường sau là bắt buộc: {', '.join(missing_fields)}"
            )
        
        # Chuyển đổi từ string về int thủ công
        opportunity_id = int(opportunity_id_str)
        student_user_id = int(student_user_id_str)
        
    except ValueError:
        raise HTTPException(
            status_code=400, 
            detail="opportunity_id and student_user_id must be valid integers."
        )
    except Exception as e:
         raise HTTPException(status_code=500, detail=f"Error reading form data: {str(e)}")


    # 2. Tạo app_base
    app_base = schemas.ApplicationBase(
        opportunity_id=opportunity_id,
        student_user_id=student_user_id
    )
    
    # Lấy thông tin Opportunity từ provider-service
    opp_data = None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PROVIDER_SERVICE_URL}/api/opportunities/{app_base.opportunity_id}")
            response.raise_for_status()
            opp_data = response.json()
    except (httpx.RequestError, httpx.HTTPStatusError):
        raise HTTPException(status_code=404, detail="Opportunity not found")

    provider_user_id = opp_data.get("provider_user_id")
    opp_title = opp_data.get("title", "Không rõ")

    # 3. Kiểm tra hồ sơ đã tồn tại
    existing = session.exec(
        select(models.Application)
        .where(models.Application.student_user_id == app_base.student_user_id)
        .where(models.Application.opportunity_id == app_base.opportunity_id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Application already submitted")
    
    # 4. Tạo Application
    db_app = models.Application(
        opportunity_id=app_base.opportunity_id,
        student_user_id=app_base.student_user_id,
        provider_user_id=provider_user_id, # Lấy từ provider-service
        status=models.ApplicationStatus.PENDING
    )
    
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    
    db_docs = []
    
    # Lưu file CV
    if cv_file and isinstance(cv_file, UploadFile):
        
        file_extension = os.path.splitext(cv_file.filename)[1]
        saved_filename = f"app_{db_app.id}_user_{student_user_id}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)

        # Lưu file từ stream
        try:
            # Tạo thư mục nếu chưa có
            os.makedirs(os.path.dirname(file_path), exist_ok=True) 
            with open(file_path, "wb") as buffer:
                # Dùng cv_file.file để truy cập stream của UploadFile
                shutil.copyfileobj(cv_file.file, buffer) 
        finally:
            await cv_file.close() # Đóng file
        
        # URL thật sự
        document_url = f"/static/cvs/{saved_filename}" 
        
        db_doc = models.ApplicationDocument(
            application_id=db_app.id,
            document_type="CV", 
            document_url=document_url
        )
        session.add(db_doc)
        db_docs.append(db_doc)
        
    session.commit()
    
    # 5. Gửi thông báo cho Provider
    background_tasks.add_task(
        notify_user,
        user_id=provider_user_id,
        content=f"Bạn có hồ sơ ứng tuyển mới (kèm CV) cho cơ hội '{opp_title}'.",
        link_url=f"/provider/application/{db_app.id}"
    )
    
    app_read = schemas.ApplicationRead.from_orm(db_app)
    # Lấy danh sách documents đã được lưu lại
    refreshed_docs = session.exec(
        select(models.ApplicationDocument).where(models.ApplicationDocument.application_id == db_app.id)
    ).all()
    app_read.documents = [schemas.DocumentRead.from_orm(doc) for doc in refreshed_docs]
    
    return app_read

async def get_unread_status_for_app(student_user_id: int, provider_user_id: int, application_id: int, user_to_check: int) -> bool:
    """
    Tạo conversation (nếu chưa có) và kiểm tra số lượng tin nhắn chưa đọc.
    Trả về True nếu có tin nhắn chưa đọc cho user_to_check.
    """
    try:
        async with httpx.AsyncClient() as client:
            # 1. Tạo hoặc lấy Conversation
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

            # 2. Lấy số lượng tin nhắn chưa đọc
            unread_resp = await client.get(
                f"{NOTIFICATION_SERVICE_URL}/api/conversations/{conversation_id}/unread_count/{user_to_check}"
            )
            unread_resp.raise_for_status()
            unread_data = unread_resp.json()

            return unread_data.get("count", 0) > 0

    except Exception as e:
        print(f"Error checking unread status for app {application_id} (user {user_to_check}): {e}")
        return False 
# --- END NEW ASYNC HELPER ---


# Sửa hàm get_applications_by_student
@router.get("/student/{user_id}", response_model=List[schemas.ApplicationReadDetail])
async def get_applications_by_student(user_id: int, session: Session = Depends(get_session)):
    """
    Lấy tất cả hồ sơ ứng tuyển của một sinh viên (ĐÃ REFACTOR).
    """
    applications = session.exec(
        select(models.Application).where(models.Application.student_user_id == user_id)
    ).all()
    
    results = []
    
    # Chuẩn bị tasks cho Opportunity và Unread Status
    tasks = []
    for app in applications:
        opp_coro = httpx.AsyncClient().get(f"{PROVIDER_SERVICE_URL}/api/opportunities/{app.opportunity_id}")
        unread_coro = get_unread_status_for_app(
            student_user_id=app.student_user_id,
            provider_user_id=app.provider_user_id,
            application_id=app.id,
            user_to_check=user_id # Kiểm tra tin nhắn chưa đọc cho Student
        )
        tasks.append((app, opp_coro, unread_coro))
        
    # Chạy tasks đồng thời
    all_results = await asyncio.gather(*[
        asyncio.gather(task[1], task[2], return_exceptions=True) 
        for task in tasks
    ])
    
    # Xử lý kết quả
    for i, result in enumerate(all_results):
        app = tasks[i][0]
        opp_resp, has_unread_messages = result
        
        opp_data = None
        if not isinstance(opp_resp, Exception) and opp_resp.status_code == 200:
            opp_data = opp_resp.json()
            
        if isinstance(has_unread_messages, Exception):
            has_unread_messages = False
            
        app_read = schemas.ApplicationRead.from_orm(app)
        results.append(schemas.ApplicationReadDetail(
            **app_read.dict(),
            opportunity=schemas.OpportunityRead.parse_obj(opp_data) if opp_data else None,
            has_unread_messages=has_unread_messages # NEW FIELD
        ))
    return results

# === ENDPOINT NỘI BỘ (Cho provider-service gọi) ===

@router.get("/provider/{user_id}", response_model=List[schemas.ApplicationRead])
def get_applications_by_provider_internal(user_id: int, session: Session = Depends(get_session)):
    """
    (Nội bộ) Lấy tất cả hồ sơ mà một provider nhận được, bao gồm documents.
    (Sử dụng serialization tường minh nhất để khắc phục lỗi Documents rỗng)
    """
    # 1. Lấy tất cả applications cho provider này
    applications = session.exec(
        select(models.Application).where(models.Application.provider_user_id == user_id)
    ).all()
    
    application_ids = [app.id for app in applications]
    if not application_ids:
        return []

    # 2. Lấy TẤT CẢ documents liên quan trong MỘT lần query (tối ưu)
    all_docs = session.exec(
        select(models.ApplicationDocument).where(models.ApplicationDocument.application_id.in_(application_ids))
    ).all()
    
    # 3. Group documents by application_id và map sang raw dict
    docs_map = {}
    for doc in all_docs:
        if doc.application_id not in docs_map:
            docs_map[doc.application_id] = []
        
        # CHUYỂN ĐỔI Document ORM SANG DICTIONARY
        docs_map[doc.application_id].append(doc.dict()) 

    # 4. Tạo kết quả cuối cùng
    results = []
    for app in applications:
        # Chuyển Application ORM object thành dictionary
        app_dict = app.dict() 
        # Gán danh sách document DICTs
        app_dict["documents"] = docs_map.get(app.id, [])
        
        # Khởi tạo ApplicationRead từ dictionary đã được làm giàu
        # Pydantic sẽ tự động chuyển đổi các dicts trong "documents" thành DocumentRead objects
        results.append(schemas.ApplicationRead(**app_dict))

    return results

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