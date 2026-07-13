from __future__ import annotations

from datetime import date
from pydantic import BaseModel


class SemesterCreate(BaseModel):
    course_id: int
    number: int
    start_date: date
    end_date: date


class SemesterRead(SemesterCreate):
    id: int

    model_config = {"from_attributes": True}


class SemesterUpdate(BaseModel):
    course_id: int | None = None
    number: int | None = None
    start_date: date | None = None
    end_date: date | None = None
