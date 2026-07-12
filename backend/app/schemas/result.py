from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ResultRead(BaseModel):
    id: int
    student_id: int
    semester_id: int
    total_marks: float
    percentage: float
    grade: str
    sgpa: float
    cgpa: float
    pass_fail_status: str
    pdf_s3_url: str
    published_at: datetime

    model_config = {"from_attributes": True}
