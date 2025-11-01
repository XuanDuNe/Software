from pydantic import BaseModel
from typing import Optional


class UploadResponse(BaseModel):
    id: int
    filename: str
    download_url: str


class FileItem(BaseModel):
    id: int
    filename: str
    created_at: Optional[str]
