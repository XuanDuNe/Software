from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime
from models import StudentProfile, ProviderProfile
from database import get_session
from models import StudentProfile
from schemas import StudentProfileRead, StudentProfileUpdate,ProviderProfileRead,ProviderProfileUpdate
from auth_utils import decode_bearer_token

router = APIRouter(prefix="/api", tags=["User Service"])


def to_read_model(profile: StudentProfile) -> StudentProfileRead:
    return StudentProfileRead(
        user_id=profile.user_id,
        full_name=profile.full_name,
        email=profile.email,
        avatar_url=profile.avatar_url,
        phone=profile.phone,
        gpa=profile.gpa,
        education_level=profile.education_level,
        major=profile.major,
        skills=profile.skills,
        achievements=profile.achievements,
        research_interests=profile.research_interests,
        thesis_topic=profile.thesis_topic,
        cv_file_id=profile.cv_file_id,
    )


@router.get("/student/profile", response_model=Optional[StudentProfileRead])
def get_my_profile(authorization: Optional[str] = Header(None), session: Session = Depends(get_session)):
    payload = decode_bearer_token(authorization)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    profile = session.exec(select(StudentProfile).where(StudentProfile.user_id == user_id)).first()
    if not profile:
        return None
    return to_read_model(profile)


@router.put("/student/profile", response_model=StudentProfileRead)
def update_my_profile(
    data: StudentProfileUpdate,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    payload = decode_bearer_token(authorization)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    profile = session.exec(select(StudentProfile).where(StudentProfile.user_id == user_id)).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        session.add(profile)
        session.commit()
        session.refresh(profile)

    for field, value in data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()

    session.add(profile)
    session.commit()
    session.refresh(profile)

    return to_read_model(profile)


@router.get("/student/profile/{user_id}", response_model=Optional[StudentProfileRead])
def get_profile_by_user_id(user_id: int, session: Session = Depends(get_session)):
    profile = session.exec(select(StudentProfile).where(StudentProfile.user_id == user_id)).first()
    if not profile:
        return None
    return to_read_model(profile)


#provider
def to_provider_read_model(profile: ProviderProfile) -> ProviderProfileRead:
    return ProviderProfileRead(
        user_id=profile.user_id,
        company_name=profile.company_name,
        contact_name=profile.contact_name,
        email=profile.email,
        phone=profile.phone,
        website=profile.website,
        description=profile.description,
    )

@router.get("/provider/profile", response_model=Optional[ProviderProfileRead])
def get_my_provider_profile(authorization: Optional[str] = Header(None), session: Session = Depends(get_session)):
    payload = decode_bearer_token(authorization)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    profile = session.exec(select(ProviderProfile).where(ProviderProfile.user_id == user_id)).first()
    if not profile:
        return None
    return to_provider_read_model(profile)

@router.put("/provider/profile", response_model=ProviderProfileRead)
def update_my_provider_profile(
    data: ProviderProfileUpdate,
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    payload = decode_bearer_token(authorization)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    profile = session.exec(select(ProviderProfile).where(ProviderProfile.user_id == user_id)).first()
    if not profile:
        profile = ProviderProfile(user_id=user_id)
        session.add(profile)
        session.commit()
        session.refresh(profile)

    for field, value in data.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()

    session.add(profile)
    session.commit()
    session.refresh(profile)

    return to_provider_read_model(profile)

@router.get("/provider/profile/{user_id}", response_model=Optional[ProviderProfileRead])
def get_provider_profile_by_user_id(user_id: int, session: Session = Depends(get_session)):
    """
    Cho phép bất kỳ người dùng nào (kể cả sinh viên) xem hồ sơ của nhà cung cấp 
    bằng user_id. (Không yêu cầu token)
    """
    # Tìm kiếm ProviderProfile theo user_id
    profile = session.exec(select(ProviderProfile).where(ProviderProfile.user_id == user_id)).first()
    
    # Nếu không tìm thấy, trả về None (hoặc 404 nếu bạn muốn)
    if not profile:
        return None
        
    # Chuyển đổi sang schema đọc và trả về
    return to_provider_read_model(profile)