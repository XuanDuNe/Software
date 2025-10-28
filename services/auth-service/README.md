# Auth Service

## Mô tả
Auth Service là một dịch vụ xác thực và quản lý người dùng, cung cấp các API để đăng ký, đăng nhập và quản lý quyền truy cập.

## Công nghệ sử dụng
- **FastAPI**: Framework chính để xây dựng API.
- **SQLAlchemy**: ORM để làm việc với cơ sở dữ liệu.
- **Pydantic**: Xác thực và quản lý dữ liệu.
- **PostgreSQL**: Cơ sở dữ liệu chính.
- **Docker**: Để triển khai dịch vụ.

## Cách chạy
### Yêu cầu
- Docker và Docker Compose đã được cài đặt.
- Python 3.9+ nếu chạy cục bộ.

### Chạy bằng Docker
- Sử dụng `docker-compose.yml` để khởi chạy:
  ```bash
  docker-compose up --build
  ```
- Dịch vụ sẽ chạy trên cổng `8001`.

### Chạy cục bộ
- Cài đặt các thư viện cần thiết:
  ```bash
  pip install -r requirements.txt
  ```
- Chạy ứng dụng:
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8001
  ```

## API chính
- `GET /`: Kiểm tra trạng thái dịch vụ.
- `POST /auth/register`: Đăng ký người dùng mới.
