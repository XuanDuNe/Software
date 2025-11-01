# Storage Service

Purpose: store CVs, research papers, scholarship documents. Supports local file storage by default and optional AWS S3.

Run locally (recommended for dev):

```powershell
cd services\storage-service
python -m venv .\venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Use PostgreSQL in prod: set DATABASE_URL, e.g.:
# $Env:DATABASE_URL = 'postgresql://user:pass@localhost:5432/storage_db'
# For local dev the service falls back to sqlite (./storage.db) if DATABASE_URL is not set.
# optional: set STORAGE_BACKEND=s3 and S3_BUCKET, AWS creds
uvicorn main:app --host 0.0.0.0 --port 8006 --reload
```

Endpoints:
- GET / -> health
- POST /upload -> multipart file, Authorization: Bearer <token>
- GET /files -> list files for current user
- GET /download/{file_id} -> download file (only owner)

Auth: service calls `http://127.0.0.1:8001/auth/verify-token` to validate bearer tokens by default. Set `AUTH_SERVICE_URL` env var to change.

Postgres / Docker notes:
- If you run services with Docker Compose, set a Postgres service and point `DATABASE_URL` to it. Example:

	postgresql://user:pass@postgres-storage:5432/storage_db

- Make sure the Postgres server is reachable and the database exists (or create it). The service will run `Base.metadata.create_all(engine)` on startup to create tables.
