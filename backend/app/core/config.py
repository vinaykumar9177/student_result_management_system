from __future__ import annotations

from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Cloud-Based Student Result Management System"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    database_url: str = Field(alias="DATABASE_URL")
    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str | None = Field(default=None, alias="JWT_REFRESH_SECRET_KEY")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    aws_region: str = Field(default="us-east-1", alias="AWS_REGION")
    aws_s3_bucket: str = Field(alias="AWS_S3_BUCKET")
    aws_sns_topic_arn: str = Field(alias="AWS_SNS_TOPIC_ARN")

    @model_validator(mode="after")
    def _fallback_refresh_secret(self) -> "Settings":
        if not self.jwt_refresh_secret_key:
            self.jwt_refresh_secret_key = self.jwt_secret_key
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
