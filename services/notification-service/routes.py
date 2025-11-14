from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from database import get_session
import models, schemas, email_utils, push_utils
from websocket_manager import manager

router = APIRouter(prefix="/api", tags=["Notification Service"])


@router.post("/conversations", response_model=schemas.ConversationRead)
def create_conversation(
    convo_in: schemas.ConversationCreate, 
    session: Session = Depends(get_session)
):
    """Tạo một cuộc trò chuyện mới (hoặc lấy cuộc trò chuyện hiện có)."""
    existing = session.exec(
        select(models.Conversation)
        .where(models.Conversation.participant1_user_id == convo_in.participant1_user_id)
        .where(models.Conversation.participant2_user_id == convo_in.participant2_user_id)
        .where(models.Conversation.application_id == convo_in.application_id) # THAY ĐỔI: Kiểm tra application_id
    ).first()
    if existing:
        return existing
        
    existing_reverse = session.exec(
        select(models.Conversation)
        .where(models.Conversation.participant1_user_id == convo_in.participant2_user_id)
        .where(models.Conversation.participant2_user_id == convo_in.participant1_user_id)
        .where(models.Conversation.application_id == convo_in.application_id) # THAY ĐỔI: Kiểm tra application_id
    ).first()
    if existing_reverse:
        return existing_reverse

    db_convo = models.Conversation.from_orm(convo_in)
    session.add(db_convo)
    session.commit()
    session.refresh(db_convo)
    return db_convo

@router.get("/conversations/{user_id}", response_model=List[schemas.ConversationRead])
def get_user_conversations(user_id: int, session: Session = Depends(get_session)):
    """Lấy tất cả các cuộc trò chuyện của một người dùng."""
    conversations = session.exec(
        select(models.Conversation)
        .where((models.Conversation.participant1_user_id == user_id) | 
               (models.Conversation.participant2_user_id == user_id))
    ).all()
    return conversations

@router.get("/messages/{conversation_id}", response_model=List[schemas.MessageRead])
def get_messages(conversation_id: int, session: Session = Depends(get_session)):
    """Lấy tất cả tin nhắn trong một cuộc trò chuyện."""
    messages = session.exec(
        select(models.Message)
        .where(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
    ).all()
    return messages

@router.post("/messages", response_model=schemas.MessageRead)
async def send_message(
    message_in: schemas.MessageCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """Gửi một tin nhắn."""
    db_message = models.Message.from_orm(message_in)
    session.add(db_message)
    session.commit()
    session.refresh(db_message)
    

    message_data = db_message.dict()
    message_data["type"] = "new_message" 
    
    background_tasks.add_task(
        manager.send_personal_message,
        message_data,
        message_in.receiver_user_id
    )
    
    return db_message


@router.post("/notifications", response_model=schemas.NotificationRead)
async def create_notification(
    notif_in: schemas.NotificationCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """(API nội bộ) Được gọi bởi các service khác để tạo thông báo."""
    db_notif = models.Notification.from_orm(notif_in)
    session.add(db_notif)
    session.commit()
    session.refresh(db_notif)
    

    notif_data = db_notif.dict()
    notif_data["type"] = "notification" 
    background_tasks.add_task(
        manager.send_personal_message,
        notif_data,
        notif_in.user_id
    )
    

    background_tasks.add_task(
        push_utils.send_push_notification_async,
        user_id=notif_in.user_id,
        title="Bạn có thông báo mới từ EduMatch",
        body=notif_in.content,
        link_url=notif_in.link_url
    )
    
    return db_notif

@router.get("/notifications/{user_id}", response_model=List[schemas.NotificationRead])
def get_user_notifications(user_id: int, session: Session = Depends(get_session)):
    """Lấy tất cả thông báo (chưa đọc và đã đọc) của người dùng."""
    notifications = session.exec(
        select(models.Notification)
        .where(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
    ).all()
    return notifications

@router.post("/notifications/{notification_id}/read", response_model=schemas.NotificationRead)
def mark_notification_as_read(notification_id: int, session: Session = Depends(get_session)):
    """Đánh dấu một thông báo là đã đọc."""
    db_notif = session.get(models.Notification, notification_id)
    if not db_notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db_notif.read_status = True
    session.add(db_notif)
    session.commit()
    session.refresh(db_notif)
    return db_notif


@router.post("/email/send", status_code=status.HTTP_202_ACCEPTED)
async def queue_email_send(
    email_in: schemas.EmailSendSchema,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """(API nội bộ) Xếp hàng một email để gửi đi (ví dụ: gửi OTP, chào mừng)."""
    
    db_log = models.EmailLog(
        recipient_email=email_in.recipient_email,
        subject=email_in.subject,
        status="pending"
    )
    session.add(db_log)
    session.commit()
    session.refresh(db_log)
    
    background_tasks.add_task(
        email_utils.send_email_async,
        log_id=db_log.id,
        subject=email_in.subject,
        recipient_email=email_in.recipient_email,
        body=email_in.body
    )
    
    return {"message": "Email queued for sending", "log_id": db_log.id}

# --- NEW ENDPOINTS FOR UNREAD MESSAGES ---

@router.post("/conversations/{conversation_id}/read/{user_id}", response_model=List[schemas.MessageRead]) # FIX: Thêm {user_id} vào đường dẫn
def mark_conversation_as_read(
    conversation_id: int, 
    user_id: int, # Là tham số Path
    session: Session = Depends(get_session)
):
    """Đánh dấu tất cả tin nhắn chưa đọc trong một cuộc trò chuyện là đã đọc cho user_id."""
    
    # Lấy các tin nhắn chưa được đọc (read_at IS NULL)
    # và được gửi bởi người KHÁC (sender_user_id != user_id)
    unread_messages = session.exec(
        select(models.Message)
        .where(models.Message.conversation_id == conversation_id)
        .where(models.Message.read_at == None) # Tin nhắn chưa đọc
        .where(models.Message.sender_user_id != user_id) # Được gửi bởi người khác
    ).all()
    
    now = datetime.utcnow()
    updated_messages = []
    
    for msg in unread_messages:
        msg.read_at = now
        session.add(msg)
        updated_messages.append(msg)
        
    session.commit()
    
    # Refresh để lấy thông tin mới nhất
    for msg in updated_messages:
        session.refresh(msg)
        
    return updated_messages


@router.get("/conversations/{conversation_id}/unread_count/{user_id}")
def get_unread_count(conversation_id: int, user_id: int, session: Session = Depends(get_session)):
    """Trả về số lượng tin nhắn chưa đọc trong cuộc trò chuyện cho user_id."""
    
    # Lấy số lượng tin nhắn chưa được đọc (read_at IS NULL)
    # và được gửi bởi người KHÁC (sender_user_id != user_id)
    unread_count_query = session.exec(
        select(models.Message)
        .where(models.Message.conversation_id == conversation_id)
        .where(models.Message.read_at == None)
        .where(models.Message.sender_user_id != user_id)
    ).all()
    
    return {"conversation_id": conversation_id, "user_id": user_id, "count": len(unread_count_query)}