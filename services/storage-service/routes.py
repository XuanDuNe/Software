from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import uuid
import mimetypes
from pathlib import Path

router = APIRouter(prefix="/api", tags=["Storage Service"])

# Thư mục lưu trữ file
STORAGE_DIR = Path("/app/storage")
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Giới hạn kích thước file (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024


@router.post("/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload file và trả về file_id
    """
    # Kiểm tra kích thước file
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 50MB")
    
    # Tạo file_id duy nhất
    file_id = str(uuid.uuid4())
    
    # Lấy extension từ tên file gốc
    file_extension = Path(file.filename).suffix if file.filename else ""
    
    # Tạo tên file mới với file_id
    stored_filename = f"{file_id}{file_extension}"
    file_path = STORAGE_DIR / stored_filename
    
    # Lưu file
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(contents)
    }


@router.get("/files/{file_id}")
async def get_file(file_id: str):
    """
    Lấy file theo file_id
    """
    # Tìm file trong storage directory
    # Có thể có nhiều extension khác nhau, nên tìm tất cả file bắt đầu bằng file_id
    matching_files = list(STORAGE_DIR.glob(f"{file_id}*"))
    
    if matching_files:
        file_path = matching_files[0]
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Detect content type from file extension
        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"
        
        return FileResponse(
            path=str(file_path),
            filename=file_path.name,
            media_type=content_type
        )
    else:
        raise HTTPException(status_code=404, detail="File not found")


@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """
    Xóa file theo file_id
    """
    matching_files = list(STORAGE_DIR.glob(f"{file_id}*"))
    
    if not matching_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        file_path = matching_files[0]
        if file_path.exists():
            file_path.unlink()
        return {"message": "File deleted successfully", "file_id": file_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

