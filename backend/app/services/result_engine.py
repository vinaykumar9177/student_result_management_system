from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.models import Examination, Mark, Notification, Result, Semester, Student, Subject, UserRole
from app.services.pdf_generator import generate_result_pdf
from app.services.s3_client import upload_bytes
from app.services.sns_client import publish_email_notification


@dataclass(slots=True)
class ResultSummary:
    total_marks: float
    percentage: float
    grade: str
    sgpa: float
    cgpa: float
    pass_fail_status: str


class ResultEngine:
    @staticmethod
    def calculate_result(marks: Iterable[Mark]) -> ResultSummary:
        total_marks = 0.0
        total_max_marks = 0.0
        passed = True

        for mark in marks:
            total_marks += float(mark.marks_obtained)
            total_max_marks += float(mark.max_marks)
            if float(mark.marks_obtained) < 40:
                passed = False

        percentage = (total_marks / total_max_marks * 100.0) if total_max_marks else 0.0
        grade = ResultEngine._grade_from_percentage(percentage)
        sgpa = round(min(10.0, max(0.0, percentage / 10.0)), 2)
        cgpa = sgpa
        pass_fail_status = "PASS" if passed and percentage >= 40.0 else "FAIL"
        return ResultSummary(total_marks=round(total_marks, 2), percentage=round(percentage, 2), grade=grade, sgpa=sgpa, cgpa=cgpa, pass_fail_status=pass_fail_status)

    @staticmethod
    def _grade_from_percentage(percentage: float) -> str:
        if percentage >= 90:
            return "A+"
        if percentage >= 80:
            return "A"
        if percentage >= 70:
            return "B+"
        if percentage >= 60:
            return "B"
        if percentage >= 50:
            return "C"
        return "F"

    @staticmethod
    def publish_semester_results(db: Session, semester_id: int, student_ids: list[int] | None = None) -> list[Result]:
        semester = db.get(Semester, semester_id)
        if semester is None:
            raise ValueError("Semester not found")

        query = db.query(Student).filter(Student.course_id == semester.course_id)
        if student_ids:
            query = query.filter(Student.id.in_(student_ids))

        published_results: list[Result] = []
        for student in query.all():
            marks = (
                db.query(Mark)
                .join(Examination, Examination.id == Mark.examination_id)
                .filter(Mark.student_id == student.id, Examination.semester_id == semester.id)
                .all()
            )
            if not marks:
                continue

            summary = ResultEngine.calculate_result(marks)
            subject_rows: list[list[str]] = []
            for mark in marks:
                subject = db.get(Subject, mark.subject_id)
                subject_rows.append([subject.name if subject else str(mark.subject_id), f"{mark.marks_obtained}", f"{mark.max_marks}"])

            pdf_bytes = generate_result_pdf(student.name, student.roll_number, semester.number, summary.__dict__, subject_rows)
            pdf_key = f"results/{student.roll_number}/semester-{semester.number}.pdf"
            pdf_url = upload_bytes(pdf_key, pdf_bytes, "application/pdf")

            result = Result(
                student_id=student.id,
                semester_id=semester.id,
                total_marks=summary.total_marks,
                percentage=summary.percentage,
                grade=summary.grade,
                sgpa=summary.sgpa,
                cgpa=summary.cgpa,
                pass_fail_status=summary.pass_fail_status,
                pdf_s3_url=pdf_url,
                published_at=datetime.now(timezone.utc),
            )
            db.add(result)
            db.add(
                Notification(
                    user_id=student.user_id,
                    message=f"Your result for semester {semester.number} has been published.",
                    type="result_published",
                )
            )
            publish_email_notification(
                subject="Result Published",
                message=f"Your semester {semester.number} result has been published for roll number {student.roll_number}.",
            )
            published_results.append(result)

        db.commit()
        for result in published_results:
            db.refresh(result)
        return published_results
