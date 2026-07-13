from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Any

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
    def calculate_result(
        marks: Iterable[Any],
        db: Session | None = None,
        student_id: int | None = None,
        current_semester_id: int | None = None,
    ) -> ResultSummary:
        total_marks = 0.0
        total_max_marks = 0.0
        passed = True

        marks_list = list(marks)
        for mark in marks_list:
            m_obt = float(mark.marks_obtained)
            m_max = float(mark.max_marks)
            total_marks += m_obt
            total_max_marks += m_max
            
            # Individual examination check: >= 40%
            if m_max > 0:
                if (m_obt / m_max) < 0.40:
                    passed = False
            else:
                passed = False

        percentage = (total_marks / total_max_marks * 100.0) if total_max_marks > 0 else 0.0
        
        # Overall percentage check: >= 40%
        if percentage < 40.0:
            passed = False

        grade = ResultEngine._grade_from_percentage(percentage)
        sgpa = round(min(10.0, max(0.0, percentage / 10.0)), 2)

        # CGPA: Calculate average of all historical semester SGPAs (including this one)
        historical_sgpas = []
        if db and student_id:
            query = db.query(Result).filter(Result.student_id == student_id)
            if current_semester_id is not None:
                query = query.filter(Result.semester_id != current_semester_id)
            historical_sgpas = [r.sgpa for r in query.all()]

        all_sgpas = historical_sgpas + [sgpa]
        cgpa = round(sum(all_sgpas) / len(all_sgpas), 2) if all_sgpas else sgpa

        pass_fail_status = "PASS" if passed else "FAIL"

        return ResultSummary(
            total_marks=round(total_marks, 2),
            percentage=round(percentage, 2),
            grade=grade,
            sgpa=sgpa,
            cgpa=cgpa,
            pass_fail_status=pass_fail_status,
        )

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
    def publish_semester_results(
        db: Session, semester_id: int, student_ids: list[int] | None = None
    ) -> list[Result]:
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

            summary = ResultEngine.calculate_result(
                marks, db=db, student_id=student.id, current_semester_id=semester.id
            )
            subject_rows: list[list[str]] = []
            for mark in marks:
                subject = db.get(Subject, mark.subject_id)
                subject_rows.append([
                    subject.name if subject else f"Subject {mark.subject_id}",
                    f"{mark.marks_obtained}",
                    f"{mark.max_marks}",
                ])

            pdf_bytes = generate_result_pdf(
                student.name, student.roll_number, semester.number, summary.__dict__, subject_rows
            )
            pdf_key = f"results/{student.roll_number}/semester-{semester.number}.pdf"
            pdf_url = upload_bytes(pdf_key, pdf_bytes, "application/pdf")

            # Save or update Result record
            result = db.query(Result).filter(
                Result.student_id == student.id,
                Result.semester_id == semester.id
            ).first()

            if result:
                result.total_marks = summary.total_marks
                result.percentage = summary.percentage
                result.grade = summary.grade
                result.sgpa = summary.sgpa
                result.cgpa = summary.cgpa
                result.pass_fail_status = summary.pass_fail_status
                result.pdf_s3_url = pdf_url
                result.published_at = datetime.now(timezone.utc)
            else:
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
                email=student.user.email,
            )
            published_results.append(result)

        db.commit()
        for result in published_results:
            db.refresh(result)
        return published_results
