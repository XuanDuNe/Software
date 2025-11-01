from pydantic import BaseModel
from datetime import datetime

class FileSchema(BaseModel):
    id: int
    filename: str
    user_id: int | None
    uploaded_at: datetime

    class Config:
        orm_mode = True
