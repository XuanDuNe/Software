from jose import jwt, JWTError
from fastapi import Header, HTTPException
from typing import Optional, Dict, Any


def decode_bearer_token(authorization: Optional[str]) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.get_unverified_claims(token)
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


