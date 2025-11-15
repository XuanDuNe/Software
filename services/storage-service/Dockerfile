FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Tạo thư mục storage
RUN mkdir -p /app/storage

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip -r requirements.txt

COPY . .

EXPOSE 8008
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8008"]

