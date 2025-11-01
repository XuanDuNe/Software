import httpx
import os

AUTH_URL = os.getenv("AUTH_SERVICE_URL", "http://127.0.0.1:8001")


def verify_token(token: str) -> dict:
    """Call auth service /auth/verify-token to validate token. Returns payload dict."""
    url = f"{AUTH_URL}/auth/verify-token"
    with httpx.Client(timeout=5.0) as client:
        r = client.post(url, json={"token": token})
        r.raise_for_status()
        return r.json()
