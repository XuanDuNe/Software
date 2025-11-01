from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from database import get_session
import models, schemas

router = APIRouter(prefix="/users", tags=["users"])

# --- User helpers (create/get) ---
@router.post("/", response_model=schemas.UserRead)
def create_user(user_in: schemas.UserCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(models.User).where(models.User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    user = models.User(email=user_in.email, full_name=user_in.full_name)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.get("/{user_id}", response_model=schemas.UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Student profile CRUD ---
@router.post("/student-profile", response_model=schemas.StudentProfileRead)
def create_student_profile(payload: schemas.StudentProfileCreate, session: Session = Depends(get_session)):
    user = session.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = session.exec(select(models.StudentProfile).where(models.StudentProfile.user_id == payload.user_id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student profile already exists")
    skills_str = ",".join(payload.skills) if payload.skills else None
    interests_str = ",".join(payload.interests) if payload.interests else None
    sp = models.StudentProfile(user_id=payload.user_id, gpa=payload.gpa, skills=skills_str, interests=interests_str, cv_url=payload.cv_url)
    session.add(sp)
    session.commit()
    session.refresh(sp)
    return _student_to_read(sp)

@router.put("/student-profile/{user_id}", response_model=schemas.StudentProfileRead)
def update_student_profile(user_id: int, payload: schemas.StudentProfileUpdate, session: Session = Depends(get_session)):
    sp = session.exec(select(models.StudentProfile).where(models.StudentProfile.user_id == user_id)).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if payload.gpa is not None:
        sp.gpa = payload.gpa
    if payload.skills is not None:
        sp.skills = ",".join(payload.skills)
    if payload.interests is not None:
        sp.interests = ",".join(payload.interests)
    if payload.cv_url is not None:
        sp.cv_url = payload.cv_url
    session.add(sp)
    session.commit()
    session.refresh(sp)
    return _student_to_read(sp)

# --- Provider profile ---
@router.post("/provider-profile", response_model=schemas.ProviderProfileRead)
def create_provider_profile(payload: schemas.ProviderProfileCreate, session: Session = Depends(get_session)):
    user = session.get(models.User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = session.exec(select(models.ProviderProfile).where(models.ProviderProfile.user_id == payload.user_id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider profile already exists")
    pp = models.ProviderProfile(user_id=payload.user_id, organization=payload.organization, country=payload.country)
    session.add(pp)
    session.commit()
    session.refresh(pp)
    return pp

# --- Save opportunity (toggle) ---
@router.post("/saved/{opportunity_id}", status_code=201)
def save_opportunity(opportunity_id: str, user_id: int, session: Session = Depends(get_session)):
    user = session.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    existing = session.exec(
        select(models.SavedOpportunity)
        .where(models.SavedOpportunity.user_id == user_id)
        .where(models.SavedOpportunity.opportunity_id == opportunity_id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already saved")
    saved = models.SavedOpportunity(user_id=user_id, opportunity_id=opportunity_id)
    session.add(saved)
    session.commit()
    session.refresh(saved)
    return {"message": "saved", "id": saved.id}

@router.delete("/saved/{opportunity_id}", status_code=200)
def unsave_opportunity(opportunity_id: str, user_id: int, session: Session = Depends(get_session)):
    saved = session.exec(
        select(models.SavedOpportunity)
        .where(models.SavedOpportunity.user_id == user_id)
        .where(models.SavedOpportunity.opportunity_id == opportunity_id)
    ).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved item not found")
    session.delete(saved)
    session.commit()
    return {"message": "unsaved"}

@router.get("/saved/{user_id}", response_model=List[schemas.SavedOpportunityRead])
def get_saved(user_id: int, session: Session = Depends(get_session)):
    items = session.exec(select(models.SavedOpportunity).where(models.SavedOpportunity.user_id == user_id)).all()
    return items

# --- Get full profile by user_id (student OR provider combined) ---
@router.get("/profile/{user_id}")
def get_full_profile(user_id: int, session: Session = Depends(get_session)):
    user = session.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    student = session.exec(select(models.StudentProfile).where(models.StudentProfile.user_id == user_id)).first()
    provider = session.exec(select(models.ProviderProfile).where(models.ProviderProfile.user_id == user_id)).first()
    saved = session.exec(select(models.SavedOpportunity).where(models.SavedOpportunity.user_id == user_id)).all()

    def parse_list_field(s):
        if not s:
            return []
        return [item for item in s.split(",") if item]

    result = {
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name},
        "student_profile": None,
        "provider_profile": None,
        "saved_opportunities": [{"id": s.id, "opportunity_id": s.opportunity_id} for s in saved]
    }

    if student:
        result["student_profile"] = {
            "id": student.id,
            "gpa": student.gpa,
            "skills": parse_list_field(student.skills),
            "interests": parse_list_field(student.interests),
            "cv_url": student.cv_url
        }

    if provider:
        result["provider_profile"] = {
            "id": provider.id,
            "organization": provider.organization,
            "country": provider.country
        }

    return result

@router.get("/", response_model=List[schemas.UserRead])
def get_all_users(session: Session = Depends(get_session)):
    return session.exec(select(models.User)).all()


# --- helper conversion ---
def _student_to_read(sp: models.StudentProfile):
    skills = sp.skills.split(",") if sp.skills else []
    interests = sp.interests.split(",") if sp.interests else []
    return {
        "id": sp.id,
        "user_id": sp.user_id,
        "gpa": sp.gpa,
        "skills": skills,
        "interests": interests,
        "cv_url": sp.cv_url
    }
