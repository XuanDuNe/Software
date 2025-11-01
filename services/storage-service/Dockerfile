FROM python:3.11-slim
WORKDIR /app
COPY ./ ./
RUN pip install fastapi uvicorn sqlalchemy psycopg2-binary python-multipart jwt
EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
