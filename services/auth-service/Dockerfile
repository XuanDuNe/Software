# Sử dụng Python image nhẹ
FROM python:3.10-slim

# Tạo thư mục làm việc trong container
WORKDIR /app

# Sao chép file cần thiết vào container
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose port 8001
EXPOSE 8001

# Lệnh chạy ứng dụng FastAPI bằng Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
