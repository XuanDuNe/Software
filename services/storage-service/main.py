from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os, uuid

from database import engine, SessionLocal, Base, get_db
import models, schemas, storage as storage_backend, auth_client

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Storage Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "storage-service", "status": "ok", "port": 8006}


def get_bearer_token(authorization: str | None = Header(None)):
    if not authorization:
        return None
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), token: str | None = Depends(get_bearer_token), db: Session = Depends(get_db)):
    # verify token via auth service
    payload = None
    if token:
        try:
            payload = auth_client.verify_token(token)
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
    else:
        raise HTTPException(status_code=401, detail="Authorization header required")

    owner_id = payload.get("user_id")
    if owner_id is None:
        raise HTTPException(status_code=400, detail="user_id missing in token payload")

    file_ext = os.path.splitext(file.filename)[1]
    file_key = f"{uuid.uuid4().hex}{file_ext}"

    # store file
    storage_info = storage_backend.save_file(file_key, await file.read(), filename=file.filename)

    db_file = models.FileMetadata(
        filename=file.filename,
        owner_id=owner_id,
        storage_key=storage_info.get("key"),
        storage_backend=storage_info.get("backend"),
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    return {"id": db_file.id, "filename": db_file.filename, "download_url": f"/download/{db_file.id}"}


@app.get("/files")
def list_files(token: str | None = Depends(get_bearer_token), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header required")
    payload = auth_client.verify_token(token)
    owner_id = payload.get("user_id")
    files = db.query(models.FileMetadata).filter(models.FileMetadata.owner_id == owner_id).all()
    return [{"id": f.id, "filename": f.filename, "created_at": f.created_at.isoformat()} for f in files]


@app.get("/download/{file_id}")
def download_file(file_id: int, token: str | None = Depends(get_bearer_token), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Authorization header required")
    payload = auth_client.verify_token(token)
    owner_id = payload.get("user_id")

    db_file = db.query(models.FileMetadata).get(file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    if db_file.owner_id != owner_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    if db_file.storage_backend == "local":
        path = storage_backend.get_local_path(db_file.storage_key)
        return FileResponse(path, filename=db_file.filename)
    elif db_file.storage_backend == "s3":
        url = storage_backend.generate_presigned_url(db_file.storage_key)
        return {"presigned_url": url}
    else:
        raise HTTPException(status_code=500, detail="Unknown storage backend")
