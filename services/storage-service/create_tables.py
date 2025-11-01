from database import SessionLocal
from models import File

db = SessionLocal()

file = File(
    filename="example.txt",
    content_type="text/plain"
)

db.add(file)
db.commit()
db.close()
print("Thêm file thành công!")
