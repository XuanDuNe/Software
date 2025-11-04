from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, status
import bcrypt

SECRET_KEY = "super_secret_key_123"  # 👉 đổi sang key riêng của bạn
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 ngày

MAX_BCRYPT_BYTES = 72

def _to_bytes(value: str) -> bytes:
    return value.encode("utf-8") if isinstance(value, str) else value

# Băm mật khẩu (truncate 72 bytes để tránh lỗi backend)
def hash_password(password: str) -> str:
    raw = _to_bytes(password)[:MAX_BCRYPT_BYTES]
    salt = bcrypt.gensalt()
    digest = bcrypt.hashpw(raw, salt)
    return digest.decode("utf-8")

# Kiểm tra mật khẩu
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        raw = _to_bytes(plain_password)[:MAX_BCRYPT_BYTES]
        return bcrypt.checkpw(raw, _to_bytes(hashed_password))
    except Exception:
        return False

# Tạo access token
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Xác thực token
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
