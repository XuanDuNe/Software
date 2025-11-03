# AI Recommendation Service

Purpose: rank scholarships for applicants by skill overlap, GPA, location and research area.

Run locally:

```powershell
cd services\ai-service
python -m venv .\venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8007 --reload
```

Endpoint:
- POST /match -> accepts applicant and list of scholarships, returns ranked results.
