from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from database import Base

class File(Base):
    __tablename__ = "files"
    filename = Column(String, primary_key=True, index=True)
    content_type = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
