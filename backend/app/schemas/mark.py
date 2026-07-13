from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class MarkCreate(BaseModel):
    student_id: int
    subject_id: int
    examination_id: int
    marks_obtained: float
    max_marks: float


class MarkRead(MarkCreate):
    id: int
    entered_by_admin_id: int
    submitted_at: datetime | None = None

    model_config = {"from_attributes": True}


class MarkUpdate(BaseModel):
    student_id: int | None = None
    subject_id: int | None = None
    examination_id: int | None = None
    marks_obtained: float | None = None
    max_marks: float | None = None
    submitted_at: datetime | None = None
