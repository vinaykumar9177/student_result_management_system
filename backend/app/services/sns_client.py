from __future__ import annotations

from functools import lru_cache

import boto3

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def get_sns_client():
    return boto3.client("sns", region_name=settings.aws_region)


def publish_email_notification(subject: str, message: str) -> str:
    response = get_sns_client().publish(TopicArn=settings.aws_sns_topic_arn, Subject=subject, Message=message)
    return response["MessageId"]
