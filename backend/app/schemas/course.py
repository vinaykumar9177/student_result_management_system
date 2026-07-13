from __future__ import annotations

from pydantic import BaseModel


class CourseCreate(BaseModel):
    name: str
    department_id: int
    duration: int


class CourseRead(CourseCreate):
    id: int

    model_config = {"from_attributes": True}


class CourseUpdate(BaseModel):
    name: str | None = None
    department_id: int | None = None
    duration: int | None = None
