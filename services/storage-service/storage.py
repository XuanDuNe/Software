import os
from typing import Dict
from pathlib import Path

STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")
LOCAL_DIR = os.getenv("STORAGE_LOCAL_DIR", "./uploads")

if STORAGE_BACKEND == "local":
    Path(LOCAL_DIR).mkdir(parents=True, exist_ok=True)


def save_file(key: str, content: bytes, filename: str) -> Dict:
    """Save file to configured backend. Returns dict with key and backend."""
    if STORAGE_BACKEND == "s3":
        # optional S3 support
        try:
            import boto3
        except Exception:
            raise RuntimeError("boto3 required for s3 storage")
        s3 = boto3.client("s3")
        bucket = os.getenv("S3_BUCKET")
        if not bucket:
            raise RuntimeError("S3_BUCKET env var required for s3 backend")
        s3.put_object(Bucket=bucket, Key=key, Body=content)
        return {"key": key, "backend": "s3"}

    # default local
    path = os.path.join(LOCAL_DIR, key)
    with open(path, "wb") as f:
        f.write(content)
    return {"key": key, "backend": "local"}


def get_local_path(key: str) -> str:
    return os.path.abspath(os.path.join(LOCAL_DIR, key))


def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    if STORAGE_BACKEND != "s3":
        raise RuntimeError("presigned urls only supported for s3 backend")
    import boto3
    s3 = boto3.client("s3")
    bucket = os.getenv("S3_BUCKET")
    return s3.generate_presigned_url(
        ClientMethod="get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=expires_in
    )
