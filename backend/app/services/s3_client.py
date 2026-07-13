from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import tempfile

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import get_settings

settings = get_settings()
LOCAL_STORAGE_ROOT = Path("student-results-local")


@lru_cache
def get_s3_client():
    return boto3.client("s3", region_name=settings.aws_region)


def upload_bytes(key: str, body: bytes, content_type: str) -> str:
    try:
        client = get_s3_client()
        client.put_object(Bucket=settings.aws_s3_bucket, Key=key, Body=body, ContentType=content_type)
        return f"s3://{settings.aws_s3_bucket}/{key}"
    except (BotoCoreError, ClientError, ValueError):
        local_path = LOCAL_STORAGE_ROOT / key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(body)
        return f"file://{local_path.as_posix()}"


def generate_presigned_download_url(key: str, expires_in: int = 3600) -> str:
    if key.startswith("file://"):
        return key

    local_path = LOCAL_STORAGE_ROOT / key
    if local_path.exists():
        return f"file://{local_path.as_posix()}"

    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.aws_s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
