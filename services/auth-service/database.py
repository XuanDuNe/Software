from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Đọc URL kết nối PostgreSQL từ biến môi trường để chạy trong Docker
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency để tạo session DB trong các route
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
