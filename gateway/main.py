from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Response
import httpx

app = FastAPI(title="API Gateway")

# CORS for browser-based frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Map tới các service thật
SERVICES = {
    "auth": "http://auth-service:8001/auth",
    "application": "http://application-service:8004/api/applications",
    "matching": "http://matching-service:8007",
    "notification": "http://notification-service:8005/api", 
    "opportunity": "http://provider-service:8006/api/opportunities",
    "provider_app": "http://provider-service:8006/api/applications"
}



# Hàm forward request
async def forward_request(service_url: str, path: str, request: Request):
    async with httpx.AsyncClient() as client:
        body = await request.body()
        headers = dict(request.headers)
        response = await client.request(
            request.method,
            f"{service_url}/{path}",
            content=body,
            headers=headers
        )
        return response

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    if service not in SERVICES:
        return {"error": "Service not found"}
    resp = await forward_request(SERVICES[service], path, request)
    return Response(content=resp.content, status_code=resp.status_code, headers=dict(resp.headers))
