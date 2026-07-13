from __future__ import annotations

from datetime import date
from pydantic import BaseModel

from app.models.examination import ExamType


class ExaminationCreate(BaseModel):
    subject_id: int
    semester_id: int
    exam_type: ExamType
    exam_date: date


class ExaminationRead(ExaminationCreate):
    id: int

    model_config = {"from_attributes": True}


class ExaminationUpdate(BaseModel):
    subject_id: int | None = None
    semester_id: int | None = None
    exam_type: ExamType | None = None
    exam_date: date | None = None
