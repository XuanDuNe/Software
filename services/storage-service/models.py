from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class FileMetadata(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    owner_id = Column(Integer, nullable=False, index=True)
    storage_key = Column(String, nullable=False, unique=True, index=True)
    storage_backend = Column(String, nullable=False, default="local")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
