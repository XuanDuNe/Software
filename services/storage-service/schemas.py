from pydantic import BaseModel
from typing import Optional


class FileUploadResponse(BaseModel):
    file_id: str
    filename: Optional[str] = None
    content_type: Optional[str] = None
    size: int


class FileDeleteResponse(BaseModel):
    message: str
    file_id: str

