from __future__ import annotations

from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str
    code: str
    credits: int
    course_id: int
    semester_number: int


class SubjectRead(SubjectCreate):
    id: int

    model_config = {"from_attributes": True}


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    credits: int | None = None
    course_id: int | None = None
    semester_number: int | None = None
