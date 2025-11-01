from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
import models
import shutil
import os

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Upload file
@router.post("/upload/")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Lưu thông tin vào DB
    new_file = models.File(filename=file.filename, content_type=file.content_type)
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return {"filename": new_file.filename, "content_type": new_file.content_type, "url": f"/files/{file.filename}"}

# Download file
@router.get("/files/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# Delete file
@router.delete("/files/{filename}")
async def delete_file(filename: str, db: Session = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        os.remove(file_path)
    # Xóa trong DB
    db.query(models.File).filter(models.File.filename == filename).delete()
    db.commit()
    return {"detail": "Deleted"}

# List files (API)
@router.get("/files/")
async def list_files(db: Session = Depends(get_db)):
    files = db.query(models.File).all()
    return [{"filename": f.filename, "content_type": f.content_type, "url": f"/files/{f.filename}"} for f in files]

# List files from DB
@router.get("/files/db/")
async def list_files_db(db: Session = Depends(get_db)):
    files = db.query(models.File).all()
    return [{"filename": f.filename, "content_type": f.content_type, "uploaded_at": str(f.created_at)} for f in files]
