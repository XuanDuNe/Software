from fastapi import FastAPI, Request
import httpx

app = FastAPI(title="API Gateway")

# Map tới các service thật
SERVICES = {
    "auth": "http://auth-service:8001",
    "application": "http://application-service:8004",
    "matching": "http://matching-service:8007",
    "notification": "http://notification-service:8005",
    "opportunity": "http://opportunity-service:8003"
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
    return resp.json()
