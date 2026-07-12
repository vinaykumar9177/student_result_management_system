from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentRead(BaseModel):
    id: int
    user_id: int
    roll_number: str
    name: str
    department_id: int
    course_id: int
    current_semester: int

    model_config = {"from_attributes": True}


class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    roll_number: str
    name: str
    department_id: int
    course_id: int
    current_semester: int
