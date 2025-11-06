# EduMatch Frontend (React)

Frontend chỉ giao tiếp với Gateway tại `http://localhost:8000` (hoặc cấu hình qua biến môi trường). Sau đăng nhập, frontend lưu JWT vào `localStorage` và điều hướng theo `user.role`.

## Cấu trúc chính
- `src/pages/Login.jsx`: Gọi `POST /auth/login` qua Gateway → lưu token + user.
- `src/components/ProtectedRoute.jsx`: Bảo vệ route, kiểm tra token và role.
- `src/pages/StudentDashboard.jsx`: Ví dụ gọi `GET /student/profile` qua Gateway.
- `src/pages/ProviderDashboard.jsx`: Ví dụ gọi `GET /provider/info` qua Gateway.
- `src/services/api.js`: Hàm `request` tự động gắn `Authorization: Bearer <token>` nếu có.

## Chạy dự án
1. Cài đặt phụ thuộc
   ```bash
   cd frontend/react
   npm install
   ```
2. Cấu hình API base URL (tùy chọn)
   - Mặc định: `http://localhost:8000`
   - Hoặc tạo `.env` trong thư mục này:
     ```env
     VITE_API_BASE_URL=http://localhost:8000
     ```
3. Dev server
   ```bash
   npm run dev
   ```
   Mở trình duyệt: `http://localhost:5173`

## Luồng hoạt động
1. Người dùng bấm Đăng nhập → FE gửi `POST /auth/login` (qua Gateway).
2. Gateway route sang Auth Service → trả về `{ access_token, token_type, user }`.
3. FE lưu `access_token` vào `localStorage` và điều hướng theo `user.role`:
   - `student` → `/student/dashboard`
   - `provider` → `/provider/dashboard`
4. Các request sau đăng nhập (ví dụ `/provider/info`, `/student/profile`) tiếp tục gọi qua Gateway, kèm header `Authorization`.

## Ghi chú
- Nếu Gateway trả `401`, FE sẽ xóa token và chuyển về `/login`.
- Có thể mở rộng role/route và tích hợp thêm các service khác như `/application/*` theo cùng mẫu.


