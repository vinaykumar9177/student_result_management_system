from __future__ import annotations

from functools import lru_cache
import logging

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


@lru_cache
def get_sns_client():
    return boto3.client("sns", region_name=settings.aws_region)


def publish_email_notification(subject: str, message: str, email: str | None = None) -> str:
    destination_info = f" (Destination: {email})" if email else ""
    try:
        response = get_sns_client().publish(
            TopicArn=settings.aws_sns_topic_arn,
            Subject=subject,
            Message=message
        )
        logger.info("SNS notification sent successfully%s. MessageId: %s", destination_info, response["MessageId"])
        return response["MessageId"]
    except (BotoCoreError, ClientError, ValueError) as exc:
        print(f"AWS SNS Notification failed. Logging to console:\nTo: {email or 'Topic Subscribers'}\nSubject: {subject}\nMessage: {message}\nError: {exc}")
        logger.warning("SNS notification skipped%s: %s", destination_info, exc)
        return ""

