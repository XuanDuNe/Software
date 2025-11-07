from typing import List, Dict, Tuple
from schemas import StudentProfile, OpportunityInput, MatchResult


def _jaccard_similarity(a: set, b: set) -> float:
    """Tính độ tương đồng Jaccard giữa 2 tập hợp"""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    intersection = a.intersection(b)
    union = a.union(b)
    return len(intersection) / len(union) if union else 0.0


def _normalize_text(text: str) -> str:
    """Chuẩn hóa text để so sánh (lowercase, trim)"""
    return text.lower().strip()


def _normalize_list(items: List[str]) -> List[str]:
    """Chuẩn hóa danh sách"""
    return [_normalize_text(item) for item in items if item]


def calculate_gpa_score(student_gpa: float, required_gpa: float) -> float:
    """
    Tính điểm GPA: 
    - Nếu không có yêu cầu GPA -> 1.0
    - Nếu GPA sinh viên >= yêu cầu -> 1.0
    - Nếu GPA sinh viên < yêu cầu -> tỷ lệ (ví dụ: 2.5/3.0 = 0.83)
    """
    if required_gpa is None or required_gpa == 0:
        return 1.0
    if student_gpa is None:
        return 0.0
    if student_gpa >= required_gpa:
        return 1.0
    # Nếu GPA thấp hơn yêu cầu, tính tỷ lệ (nhưng không quá thấp)
    return max(0.3, student_gpa / required_gpa)


def calculate_skills_match(student_skills: List[str], required_skills: List[str]) -> float:
    """Tính độ khớp kỹ năng bằng Jaccard similarity"""
    if not required_skills:
        return 1.0  # Không yêu cầu kỹ năng cụ thể
    if not student_skills:
        return 0.0
    
    student_set = set(_normalize_list(student_skills))
    required_set = set(_normalize_list(required_skills))
    
    return _jaccard_similarity(student_set, required_set)


def calculate_interests_match(student_interests: List[str], description: str) -> float:
    """
    Tính độ khớp sở thích với mô tả opportunity
    Tìm kiếm từ khóa trong description
    """
    if not student_interests:
        return 0.5  # Không có sở thích thì cho điểm trung bình
    
    description_lower = _normalize_text(description)
    matched = 0
    
    for interest in student_interests:
        interest_normalized = _normalize_text(interest)
        if interest_normalized in description_lower:
            matched += 1
    
    # Tỷ lệ số sở thích được tìm thấy
    return matched / len(student_interests) if student_interests else 0.0


def calculate_goals_match(student_goals: List[str], opportunity_type: str, description: str) -> float:
    """
    Tính độ khớp mục tiêu:
    - Research goals -> research_lab, scholarship (research-oriented)
    - Industry goals -> program, scholarship (industry-oriented)
    - Academic goals -> scholarship, program
    """
    if not student_goals:
        return 0.5
    
    description_lower = _normalize_text(description)
    goals_lower = [g.lower() for g in student_goals]
    
    # Mapping giữa goals và opportunity types
    research_keywords = ["research", "academic", "study", "thesis", "phd", "master"]
    industry_keywords = ["industry", "job", "career", "work", "internship", "employment"]
    
    score = 0.0
    
    # Kiểm tra research goals
    if any("research" in g or "academic" in g for g in goals_lower):
        if opportunity_type == "research_lab" or any(kw in description_lower for kw in research_keywords):
            score += 0.5
    
    # Kiểm tra industry goals
    if any("industry" in g or "job" in g or "career" in g for g in goals_lower):
        if opportunity_type == "program" or any(kw in description_lower for kw in industry_keywords):
            score += 0.5
    
    return min(1.0, score)


def calculate_strengths_match(student_strengths: List[str], description: str, required_skills: List[str]) -> float:
    """
    Tính điểm khớp điểm mạnh:
    - Điểm mạnh có thể bù đắp cho kỹ năng thiếu
    - Điểm mạnh được đề cập trong description sẽ được ưu tiên
    """
    if not student_strengths:
        return 0.5
    
    description_lower = _normalize_text(description)
    strengths_set = set(_normalize_list(student_strengths))
    required_skills_set = set(_normalize_list(required_skills))
    
    # Kiểm tra điểm mạnh có trong description
    description_match = 0
    for strength in strengths_set:
        if strength in description_lower:
            description_match += 1
    
    # Kiểm tra điểm mạnh có liên quan đến kỹ năng yêu cầu
    skill_related = len(strengths_set.intersection(required_skills_set))
    
    # Tính điểm: 50% từ description match, 50% từ skill related
    desc_score = description_match / len(strengths_set) if strengths_set else 0.0
    skill_score = skill_related / len(required_skills_set) if required_skills_set else 0.0
    
    return (desc_score * 0.5) + (skill_score * 0.5)


def calculate_match_score(student: StudentProfile, opportunity: OpportunityInput) -> Tuple[float, List[str]]:
    """
    Tính điểm tổng hợp và lý do khớp
    Trả về (score, reasons)
    """
    reasons = []
    criteria = opportunity.criteria
    
    # 1. GPA Score (20%)
    gpa_score = 0.0
    if criteria and criteria.gpa_min:
        gpa_score = calculate_gpa_score(student.gpa or 0.0, criteria.gpa_min)
        if gpa_score >= 1.0:
            reasons.append(f"Đáp ứng yêu cầu GPA ({criteria.gpa_min})")
        elif gpa_score >= 0.7:
            reasons.append(f"GPA gần đạt yêu cầu ({student.gpa:.2f}/{criteria.gpa_min})")
    else:
        gpa_score = 1.0  # Không yêu cầu GPA
    
    # 2. Skills Match (30%)
    required_skills = criteria.skills if criteria else []
    skills_score = calculate_skills_match(student.skills, required_skills)
    if skills_score > 0.7:
        matched_skills = set(_normalize_list(student.skills)).intersection(set(_normalize_list(required_skills)))
        if matched_skills:
            reasons.append(f"Khớp kỹ năng: {', '.join(list(matched_skills)[:3])}")
    elif skills_score > 0.3:
        reasons.append("Một số kỹ năng phù hợp")
    
    # 3. Interests Match (20%)
    interests_score = calculate_interests_match(student.interests, opportunity.description)
    if interests_score > 0.5:
        reasons.append("Phù hợp với sở thích của bạn")
    
    # 4. Goals Match (15%)
    goals_score = calculate_goals_match(student.goals, opportunity.type, opportunity.description)
    if goals_score > 0.5:
        reasons.append(f"Phù hợp với mục tiêu ({', '.join(student.goals[:2])})")
    
    # 5. Strengths Match (15%)
    strengths_score = calculate_strengths_match(student.strengths, opportunity.description, required_skills)
    if strengths_score > 0.6:
        reasons.append("Điểm mạnh phù hợp với yêu cầu")
    
    # Tính điểm tổng hợp với trọng số
    total_score = (
        gpa_score * 0.20 +
        skills_score * 0.30 +
        interests_score * 0.20 +
        goals_score * 0.15 +
        strengths_score * 0.15
    )
    
    # Nếu không có lý do nào, thêm lý do chung
    if not reasons:
        reasons.append("Cơ hội phù hợp với hồ sơ của bạn")
    
    return round(total_score, 4), reasons


def match_opportunities(student: StudentProfile, opportunities: List[OpportunityInput]) -> List[MatchResult]:
    """
    Matching các opportunities với student profile
    Trả về danh sách đã được sắp xếp theo điểm số
    """
    results = []
    
    for opp in opportunities:
        score, reasons = calculate_match_score(student, opp)
        
        result = MatchResult(
            opportunity_id=opp.id,
            title=opp.title,
            description=opp.description,
            type=opp.type,
            score=score,
            match_reasons=reasons
        )
        results.append(result)
    
    # Sắp xếp theo điểm số giảm dần
    results.sort(key=lambda x: x.score, reverse=True)
    
    return results
