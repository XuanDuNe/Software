from typing import List, Dict
from .schemas import ApplicantInput, ScholarshipInput


def _jaccard(a: set, b: set) -> float:
    if not a and not b:
        return 1.0
    inter = a.intersection(b)
    union = a.union(b)
    return len(inter) / len(union) if union else 0.0


def score(applicant: ApplicantInput, scholarship: ScholarshipInput) -> float:
    s = 0.0
    weight_skills = 0.5
    weight_gpa = 0.2
    weight_loc = 0.1
    weight_research = 0.2

    # skills
    a_sk = set([x.lower() for x in applicant.skills or []])
    s_sk = set([x.lower() for x in scholarship.required_skills or []])
    skill_score = _jaccard(a_sk, s_sk)

    # gpa
    gpa_score = 0.0
    if scholarship.min_gpa is None:
        gpa_score = 1.0
    elif applicant.gpa is None:
        gpa_score = 0.0
    else:
        gpa_score = 1.0 if applicant.gpa >= scholarship.min_gpa else applicant.gpa / scholarship.min_gpa

    # location
    loc_score = 1.0 if (applicant.location and scholarship.location and applicant.location.lower() == scholarship.location.lower()) else 0.0

    # research
    a_rf = set([x.lower() for x in applicant.research_fields or []])
    s_rf = set([x.lower() for x in scholarship.research_fields or []])
    research_score = _jaccard(a_rf, s_rf)

    s = (skill_score * weight_skills) + (gpa_score * weight_gpa) + (loc_score * weight_loc) + (research_score * weight_research)
    return round(s, 4)


def rank_scholarships(applicant: ApplicantInput, scholarships: List[ScholarshipInput]) -> List[Dict]:
    scored = []
    for sch in scholarships:
        sc = score(applicant, sch)
        scored.append({"id": sch.id, "title": sch.title, "score": sc})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored
