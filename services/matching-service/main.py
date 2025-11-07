from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import List
import matcher
from schemas import (
    StudentProfile,
    OpportunityInput,
    CriteriaInput,
    MatchRequest,
    MatchResponse,
    MatchResult
)

app = FastAPI(title="Matching Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# URL của provider-service (có thể override bằng environment variable)
PROVIDER_SERVICE_URL = os.getenv(
    "PROVIDER_SERVICE_URL",
    "http://provider-service:8006"
)


@app.get("/")
def root():
    return {"service": "matching-service", "status": "ok", "port": 8007}


async def fetch_opportunities_from_provider() -> List[OpportunityInput]:
    """
    Lấy danh sách opportunities từ provider-service
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{PROVIDER_SERVICE_URL}/api/opportunities/")
            response.raise_for_status()
            data = response.json()
            
            # Chuyển đổi dữ liệu từ provider-service sang OpportunityInput
            opportunities = []
            for opp in data:
                criteria = None
                if opp.get("criteria"):
                    crit_data = opp["criteria"]
                    criteria = CriteriaInput(
                        gpa_min=crit_data.get("gpa_min"),
                        skills=crit_data.get("skills", []),
                        required_documents=crit_data.get("required_documents", []),
                        deadline=crit_data.get("deadline")
                    )
                
                opportunity = OpportunityInput(
                    id=opp["id"],
                    title=opp["title"],
                    description=opp.get("description", ""),
                    type=opp.get("type", "scholarship"),
                    provider_user_id=opp["provider_user_id"],
                    criteria=criteria
                )
                opportunities.append(opportunity)
            
            return opportunities
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Không thể kết nối tới provider-service: {str(e)}"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Lỗi từ provider-service: {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy opportunities: {str(e)}"
        )


@app.post("/match", response_model=MatchResponse)
async def match_student_to_opportunities(request: MatchRequest):
    """
    Matching sinh viên với các opportunities
    
    Request body:
    {
        "student_user_id": 1,
        "student_profile": {
            "user_id": 1,
            "gpa": 3.5,
            "skills": ["Python", "Machine Learning"],
            "goals": ["research", "academic"],
            "strengths": ["analytical", "programming"],
            "interests": ["AI", "Data Science"],
            "location": "Ho Chi Minh City"
        }
    }
    """
    try:
        # Validate student_user_id khớp với profile
        if request.student_user_id != request.student_profile.user_id:
            raise HTTPException(
                status_code=400,
                detail="student_user_id phải khớp với student_profile.user_id"
            )
        
        # Lấy danh sách opportunities từ provider-service
        opportunities = await fetch_opportunities_from_provider()
        
        if not opportunities:
            return MatchResponse(
                student_user_id=request.student_user_id,
                results=[],
                total_opportunities=0
            )
        
        # Thực hiện matching
        match_results = matcher.match_opportunities(
            request.student_profile,
            opportunities
        )
        
        return MatchResponse(
            student_user_id=request.student_user_id,
            results=match_results,
            total_opportunities=len(opportunities)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thực hiện matching: {str(e)}"
        )


@app.get("/match/simple")
async def match_simple(
    student_user_id: int,
    gpa: float = None,
    skills: str = "",
    goals: str = "",
    strengths: str = "",
    interests: str = ""
):
    """
    Endpoint đơn giản hơn để matching:
    - skills, goals, strengths, interests: chuỗi phân cách bởi dấu phẩy
    
    Ví dụ:
    GET /match/simple?student_user_id=1&gpa=3.5&skills=Python,ML&goals=research
    """
    try:
        # Parse các chuỗi thành list
        skills_list = [s.strip() for s in skills.split(",") if s.strip()] if skills else []
        goals_list = [g.strip() for g in goals.split(",") if g.strip()] if goals else []
        strengths_list = [s.strip() for s in strengths.split(",") if s.strip()] if strengths else []
        interests_list = [i.strip() for i in interests.split(",") if i.strip()] if interests else []
        
        # Tạo student profile
        student_profile = StudentProfile(
            user_id=student_user_id,
            gpa=gpa,
            skills=skills_list,
            goals=goals_list,
            strengths=strengths_list,
            interests=interests_list
        )
        
        # Lấy opportunities
        opportunities = await fetch_opportunities_from_provider()
        
        if not opportunities:
            return {
                "student_user_id": student_user_id,
                "results": [],
                "total_opportunities": 0
            }
        
        # Matching
        match_results = matcher.match_opportunities(student_profile, opportunities)
        
        # Chuyển đổi sang dict để trả về
        results_dict = [
            {
                "opportunity_id": r.opportunity_id,
                "title": r.title,
                "description": r.description,
                "type": r.type,
                "score": r.score,
                "match_reasons": r.match_reasons
            }
            for r in match_results
        ]
        
        return {
            "student_user_id": student_user_id,
            "results": results_dict,
            "total_opportunities": len(opportunities)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi thực hiện matching: {str(e)}"
        )
