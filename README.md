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

## Chạy toàn bộ (Frontend + Gateway + Services)

1) Build và chạy toàn bộ stack:
```bash
docker compose up -d --build
```

2) Kiểm tra container:
```bash
docker compose ps
```

3) Mở ứng dụng Frontend:
- Frontend (NGINX): `http://localhost:5173`
- Frontend chỉ gọi Gateway: base URL được set khi build là `http://gateway:8000` (trong mạng Docker). Khi chạy dev cục bộ, dùng `VITE_API_BASE_URL=http://localhost:8000`.

4) Các endpoint cơ bản (tham khảo/debug):
- Gateway: `http://localhost:8000/{service}/{path}` (proxy tới các service)
- Auth: `http://localhost:8001/`
- Application: `http://localhost:8004/`
- Notification: `http://localhost:8005/`
- Provider: `http://localhost:8006/`
- Matching: `http://localhost:8007/`

Gọi qua Gateway (ví dụ):
```bash
# Root của auth-service qua gateway
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

## Đăng ký, đăng nhập qua Gateway (để vào Frontend)

Auth Service dùng schema có trường `email`, `password`, `role`. Bạn có thể tạo tài khoản và đăng nhập hoàn toàn qua Gateway:

1) Đăng ký (ví dụ role student):
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "12345678",
    "role": "student"
  }'
```

2) Đăng nhập (lấy access_token):
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "12345678"
  }'
```

3) Xác minh token (FE dùng để lấy `role` và `user_id`):
```bash
curl -X POST http://localhost:8000/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<JWT từ bước đăng nhập>"
  }'
```

Sau khi có tài khoản, mở `http://localhost:5173`, đăng nhập bằng email/password. FE sẽ lưu JWT vào `localStorage`, đọc `role` để điều hướng:
- student → `/student/dashboard`
- provider → `/provider/dashboard`

## Student Dashboard (FE) đang làm gì?
- Liệt kê cơ hội (Provider Service) qua Gateway: `GET /opportunity/`
- Liệt kê hồ sơ đã nộp (Application Service) qua Gateway: `GET /application/student/{user_id}`
- Nộp hồ sơ (Application Service) qua Gateway: `POST /application/`

## Chạy Frontend ở chế độ dev (tùy chọn)
```bash
cd frontend/react
npm install
echo VITE_API_BASE_URL=http://localhost:8000 > .env
npm run dev
```
Mở `http://localhost:5173`. Ở chế độ Docker, biến URL đã được set khi build image.

## Thư mục quan trọng

- `gateway/`: API Gateway (FastAPI + httpx) forward request tới các service
- `services/auth-service/`: Xác thực người dùng (SQLAlchemy + PostgreSQL)
- `services/opportunity-service/`: Quản lý cơ hội (SQLModel + PostgreSQL)
- `services/application-service/`: Quản lý hồ sơ ứng tuyển (SQLModel + PostgreSQL)
- `services/notification-service/`: Thông báo/chat/WebSocket (SQLModel + PostgreSQL)
- `services/matching-service/`: Gợi ý/AI (không dùng DB)


