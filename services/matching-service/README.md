# Matching Service

Service gợi ý các cơ hội (opportunities) phù hợp cho sinh viên dựa trên hồ sơ của họ.

## Chức năng

- Nhận dữ liệu từ **provider-service** (opportunities/courses)
- Phân tích hồ sơ sinh viên: GPA, kỹ năng, mục tiêu, điểm mạnh, sở thích
- Sử dụng thuật toán matching cơ bản để tính điểm phù hợp
- Trả về danh sách opportunities đã được sắp xếp theo độ phù hợp

## Thuật toán Matching

Service sử dụng các thuật toán cơ bản (không dùng AI):

1. **GPA Matching (20%)**: So sánh GPA sinh viên với yêu cầu tối thiểu
2. **Skills Matching (30%)**: Tính độ tương đồng Jaccard giữa kỹ năng sinh viên và yêu cầu
3. **Interests Matching (20%)**: Tìm kiếm từ khóa sở thích trong mô tả opportunity
4. **Goals Matching (15%)**: So khớp mục tiêu (research/industry/academic) với loại opportunity
5. **Strengths Matching (15%)**: Đánh giá điểm mạnh có liên quan đến yêu cầu

## API Endpoints

### POST `/match`

Matching với profile đầy đủ:

```json
{
  "student_user_id": 1,
  "student_profile": {
    "user_id": 1,
    "gpa": 3.5,
    "skills": ["Python", "Machine Learning"],
    "goals": ["research", "academic"],
    "strengths": ["analytical", "programming"],
    "interests": ["AI", "Data Science"],
    "location": "Ho Chi Minh City"
  }
}
```

### GET `/match/simple`

Matching đơn giản với query parameters:

```
GET /match/simple?student_user_id=1&gpa=3.5&skills=Python,ML&goals=research
```

## Chạy Service

### Local Development

```bash
cd services/matching-service
python -m venv venv
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8007 --reload
```

### Docker

Service được cấu hình trong `docker-compose.yml`:

```yaml
matching-service:
  build: ./services/matching-service
  ports:
    - "8007:8007"
  environment:
    - PROVIDER_SERVICE_URL=http://provider-service:8006
  depends_on:
    provider-service:
      condition: service_started
```

## Environment Variables

- `PROVIDER_SERVICE_URL`: URL của provider-service (mặc định: `http://provider-service:8006`)

## Dependencies

- `fastapi`: Web framework
- `uvicorn`: ASGI server
- `pydantic`: Data validation
- `httpx`: HTTP client để gọi provider-service
