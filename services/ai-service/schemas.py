from pydantic import BaseModel
from typing import List, Optional


class ApplicantInput(BaseModel):
    id: Optional[int]
    skills: List[str] = []
    gpa: Optional[float]
    location: Optional[str]
    research_fields: List[str] = []


class ScholarshipInput(BaseModel):
    id: Optional[int]
    title: Optional[str]
    required_skills: List[str] = []
    min_gpa: Optional[float]
    location: Optional[str]
    research_fields: List[str] = []
