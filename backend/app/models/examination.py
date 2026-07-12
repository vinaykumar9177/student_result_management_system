from __future__ import annotations

from datetime import date
from enum import Enum

from sqlalchemy import Date, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class ExamType(str, Enum):
    internal = "internal"
    external = "external"


class Examination(TimestampMixin, Base):
    __tablename__ = "examinations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    exam_type: Mapped[ExamType] = mapped_column(SQLEnum(ExamType, name="exam_type"), nullable=False)
    exam_date: Mapped[date] = mapped_column(Date, nullable=False)

    subject = relationship("Subject", back_populates="examinations")
    semester = relationship("Semester", back_populates="examinations")
    marks = relationship("Mark", back_populates="examination", cascade="all, delete-orphan")
