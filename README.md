EduMatch - Microservices (Dockerized)

Dự án gồm nhiều service FastAPI chạy sau API Gateway. Bộ docker-compose đã được cấu hình để có thể build và chạy toàn bộ hệ thống bằng một lệnh duy nhất.

## Kiến trúc dịch vụ

- Gateway (cổng API): `http://localhost:8000`
- Auth Service: `http://localhost:8001`
- Opportunity Service: `http://localhost:8003`
- Application Service: `http://localhost:8004`
- Notification Service: `http://localhost:8005`
- Matching (AI) Service: `http://localhost:8007`

Mỗi service có thể truy cập nội bộ qua tên service trong mạng Docker:
- `auth-service:8001`
- `opportunity-service:8003`
- `application-service:8004`
- `notification-service:8005`
- `matching-service:8007`

Các service sử dụng cơ sở dữ liệu PostgreSQL riêng (trừ matching-service và gateway không dùng DB). Biến môi trường `DATABASE_URL` được truyền từ docker-compose cho từng service.

## Yêu cầu

- Docker Desktop (Windows/macOS) hoặc Docker Engine + Docker Compose (Linux)

## Cách chạy

1) Build và chạy toàn bộ stack:
```bash
docker compose up -d --build
```

2) Kiểm tra container:
```bash
docker compose ps
```

3) Truy cập các endpoint cơ bản:
- Gateway: `http://localhost:8000/{service}/{path}` (proxy tới các service)
- Auth: `http://localhost:8001/`
- Opportunity: `http://localhost:8003/`
- Application: `http://localhost:8004/`
- Notification: `http://localhost:8005/`
- Matching: `http://localhost:8007/`

Ví dụ gọi qua gateway:
```bash
# Ví dụ gọi root của auth-service qua gateway
curl http://localhost:8000/auth/
```

## Cấu hình Docker chính

- `docker-compose.yml`: định nghĩa toàn bộ services, database Postgres, port mapping và biến môi trường.
- Mỗi service có `Dockerfile` riêng, chạy bằng Uvicorn và expose port tương ứng.
- `services/auth-service/database.py` đã được cấu hình đọc `DATABASE_URL` từ biến môi trường để chạy trong Docker.
- `gateway/main.py` đã map đúng port tới các service nội bộ.

## Phát triển & Debug

- Xem logs của một service:
```bash
docker compose logs -f auth-service
```

- Rebuild một service khi thay đổi mã nguồn:
```bash
docker compose build auth-service && docker compose up -d auth-service
```

- Dừng toàn bộ:
```bash
docker compose down
```

## Thư mục quan trọng

- `gateway/`: API Gateway (FastAPI + httpx) forward request tới các service
- `services/auth-service/`: Xác thực người dùng (SQLAlchemy + PostgreSQL)
- `services/opportunity-service/`: Quản lý cơ hội (SQLModel + PostgreSQL)
- `services/application-service/`: Quản lý hồ sơ ứng tuyển (SQLModel + PostgreSQL)
- `services/notification-service/`: Thông báo/chat/WebSocket (SQLModel + PostgreSQL)
- `services/matching-service/`: Gợi ý/AI (không dùng DB)


