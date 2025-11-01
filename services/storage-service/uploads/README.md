# User Service (FastAPI)

## Run local

1️⃣ Create database:
```sql
CREATE DATABASE users_db;
```

2️⃣ Create virtual env and install deps:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

3️⃣ Start service:
```bash
uvicorn app.main:app --reload --port 8002
```

Swagger UI: [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs)
