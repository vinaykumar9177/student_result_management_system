from __future__ import annotations

from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    code: str


class DepartmentRead(DepartmentCreate):
    id: int

    model_config = {"from_attributes": True}
