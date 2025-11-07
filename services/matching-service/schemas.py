from pydantic import BaseModel
from typing import List, Optional


class StudentProfile(BaseModel):
    """Thông tin hồ sơ sinh viên"""
    user_id: int
    gpa: Optional[float] = None
    skills: List[str] = []  # Kỹ năng
    goals: List[str] = []  # Mục tiêu (ví dụ: "research", "industry", "academic")
    strengths: List[str] = []  # Điểm mạnh (ví dụ: "leadership", "programming", "analytical")
    interests: List[str] = []  # Sở thích/lĩnh vực quan tâm
    location: Optional[str] = None


class CriteriaInput(BaseModel):
    """Tiêu chí của opportunity"""
    gpa_min: Optional[float] = None
    skills: List[str] = []
    required_documents: List[str] = []
    deadline: Optional[str] = None


class OpportunityInput(BaseModel):
    """Thông tin cơ hội từ provider-service"""
    id: int
    title: str
    description: str
    type: str  # "scholarship", "research_lab", "program"
    provider_user_id: int
    criteria: Optional[CriteriaInput] = None


class MatchRequest(BaseModel):
    """Request để matching"""
    student_user_id: int
    student_profile: StudentProfile  # Profile của sinh viên


class MatchResult(BaseModel):
    """Kết quả matching một opportunity"""
    opportunity_id: int
    title: str
    description: str
    type: str
    score: float  # Điểm số từ 0-1
    match_reasons: List[str] = []  # Lý do khớp


class MatchResponse(BaseModel):
    """Response trả về danh sách opportunities đã được sắp xếp"""
    student_user_id: int
    results: List[MatchResult]
    total_opportunities: int
