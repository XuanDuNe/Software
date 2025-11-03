from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from . import matcher, schemas
from pydantic import BaseModel
from typing import List


class MatchRequest(BaseModel):
    applicant: schemas.ApplicantInput
    scholarships: List[schemas.ScholarshipInput]

app = FastAPI(title="AI Recommendation Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "ai-service", "status": "ok", "port": 8007}


@app.post("/match")
def match(req: MatchRequest):
    try:
        results = matcher.rank_scholarships(req.applicant, req.scholarships)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
