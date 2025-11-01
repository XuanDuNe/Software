from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Thông tin kết nối PostgreSQL
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:12345678@localhost:5432/auth_db"

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
