from __future__ import annotations

import datetime as dt
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SQLEnum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class UserRole(str, Enum):
    admin = "admin"
    student = "student"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLEnum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    must_reset_password: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    student_profile = relationship("Student", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
