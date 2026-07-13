from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class UserRead(BaseModel):
    id: int
    email: EmailStr
    role: UserRole
    is_active: bool
    must_reset_password: bool
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
    password: str | None = Field(default=None, min_length=8)
    roll_number: str
    name: str
    department_id: int
    course_id: int
    current_semester: int


class StudentAccountRead(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    roll_number: str
    name: str
    department_id: int
    course_id: int
    current_semester: int

    model_config = {"from_attributes": True}


class StudentAccountCreateResponse(BaseModel):
    student: StudentAccountRead
    temporary_password: str


class StudentMarkRead(BaseModel):
    id: int
    student_id: int
    roll_number: str
    student_name: str
    subject: str
    semester_id: int
    semester_number: int
    branch: str
    marks_obtained: float
    max_marks: float
    examination_type: str
    exam_date: date | None = None


class StudentUpdate(BaseModel):
    name: str | None = None
    roll_number: str | None = None
    department_id: int | None = None
    course_id: int | None = None
    current_semester: int | None = None


class BulkCreateResponse(BaseModel):
    success_count: int
    errors: list[str]
    students: list[StudentAccountRead]

