from fastapi import APIRouter, Depends, HTTPException, Header
from sqlmodel import Session, select
from typing import Optional
from datetime import datetime

from database import get_session
from models import StudentProfile
from schemas import StudentProfileRead, StudentProfileUpdate
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


