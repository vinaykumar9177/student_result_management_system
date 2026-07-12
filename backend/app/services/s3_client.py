from __future__ import annotations

from functools import lru_cache

import boto3

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def get_s3_client():
    return boto3.client("s3", region_name=settings.aws_region)


def upload_bytes(key: str, body: bytes, content_type: str) -> str:
    client = get_s3_client()
    client.put_object(Bucket=settings.aws_s3_bucket, Key=key, Body=body, ContentType=content_type)
    return f"s3://{settings.aws_s3_bucket}/{key}"


def generate_presigned_download_url(key: str, expires_in: int = 3600) -> str:
    client = get_s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.aws_s3_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
