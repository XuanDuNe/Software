from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from routers import files

app = FastAPI(title="Storage Service")

# ✅ Bật CORS để cho phép HTML gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép mọi domain (dùng localhost cũng được)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files.router)

@app.get("/")
def root():
    return {"message": "Storage service running!"}
