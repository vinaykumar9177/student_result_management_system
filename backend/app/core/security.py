from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Workaround for bcrypt >= 4.0.0 and passlib compatibility
try:
    import passlib.handlers.bcrypt
    original_calc_checksum = passlib.handlers.bcrypt._BcryptBackend._calc_checksum
    def safe_calc_checksum(self, secret):
        if isinstance(secret, str):
            secret_bytes = secret.encode("utf-8")
        else:
            secret_bytes = secret
        if len(secret_bytes) > 72:
            secret_bytes = secret_bytes[:72]
        if isinstance(secret, str):
            secret = secret_bytes.decode("utf-8", errors="ignore")
        else:
            secret = secret_bytes
        return original_calc_checksum(self, secret)
    passlib.handlers.bcrypt._BcryptBackend._calc_checksum = safe_calc_checksum
except Exception:
    pass



def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _create_token(subject: str, secret_key: str, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(subject, settings.jwt_secret_key, timedelta(minutes=settings.access_token_expire_minutes))


def create_refresh_token(subject: str) -> str:
    return _create_token(subject, settings.jwt_refresh_secret_key, timedelta(days=settings.refresh_token_expire_days))


def decode_token(token: str, secret_key: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


def generate_temporary_password() -> str:
    import secrets
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(12))


def generate_reset_token() -> str:
    import secrets
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()

