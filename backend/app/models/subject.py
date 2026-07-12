from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Subject(TimestampMixin, Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_number: Mapped[int] = mapped_column(Integer, nullable=False)

    course = relationship("Course", back_populates="subjects")
    faculty_assignments = relationship("FacultySubject", back_populates="subject", cascade="all, delete-orphan")
    examinations = relationship("Examination", back_populates="subject", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="subject")
