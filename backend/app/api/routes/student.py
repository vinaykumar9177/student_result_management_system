from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db, require_role
from app.models import Mark, Result, Student, UserRole, Semester
from app.schemas.result import ResultRead
from app.schemas.user import StudentMarkRead
from app.services.s3_client import generate_presigned_download_url
from pydantic import BaseModel

router = APIRouter(dependencies=[Depends(require_role(UserRole.student))])


class StudentProfileResponse(BaseModel):
    id: int
    roll_number: str
    name: str
    email: str
    current_semester: int
    department_name: str
    department_code: str
    course_name: str
    course_duration: int


class SubjectMarkInfo(BaseModel):
    subject_name: str
    subject_code: str
    marks_obtained: float
    max_marks: float
    percentage: float


class SemesterProgressInfo(BaseModel):
    semester_number: int
    sgpa: float
    cgpa: float


class StudentDashboardResponse(BaseModel):
    selected_semester_id: int | None
    subject_marks: list[SubjectMarkInfo]
    cgpa_history: list[SemesterProgressInfo]


class ResultDownloadResponse(BaseModel):
    download_url: str


@router.get("/profile", response_model=StudentProfileResponse)
def get_profile(current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return StudentProfileResponse(
        id=student.id,
        roll_number=student.roll_number,
        name=student.name,
        email=student.user.email,
        current_semester=student.current_semester,
        department_name=student.department.name,
        department_code=student.department.code,
        course_name=student.course.name,
        course_duration=student.course.duration,
    )


@router.get("/dashboard", response_model=StudentDashboardResponse)
def get_dashboard(
    semester_id: int | None = None,
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")

    # Determine selected semester
    selected_sem_id = semester_id
    if not selected_sem_id:
        # Fallback to the student's current semester ID if there is a semester matching it
        sem = db.query(Semester).filter(Semester.course_id == student.course_id, Semester.number == student.current_semester).first()
        if sem:
            selected_sem_id = sem.id
        else:
            # Otherwise pick the latest semester recorded in marks or any semester
            last_mark = db.query(Mark).filter(Mark.student_id == student.id).join(Mark.examination).first()
            if last_mark:
                selected_sem_id = last_mark.examination.semester_id

    # Fetch subject-wise marks
    subject_marks = []
    if selected_sem_id:
        marks_db = (
            db.query(Mark)
            .join(Mark.examination)
            .filter(Mark.student_id == student.id, Mark.examination.has(semester_id=selected_sem_id))
            .all()
        )
        for m in marks_db:
            pct = round((m.marks_obtained / m.max_marks) * 100, 2) if m.max_marks > 0 else 0.0
            subject_marks.append(
                SubjectMarkInfo(
                    subject_name=m.subject.name,
                    subject_code=m.subject.code,
                    marks_obtained=m.marks_obtained,
                    max_marks=m.max_marks,
                    percentage=pct,
                )
            )

    # Fetch CGPA/SGPA history
    results_db = (
        db.query(Result)
        .join(Semester, Semester.id == Result.semester_id)
        .filter(Result.student_id == student.id)
        .order_by(Semester.number.asc())
        .all()
    )
    cgpa_history = [
        SemesterProgressInfo(
            semester_number=r.semester.number,
            sgpa=r.sgpa,
            cgpa=r.cgpa,
        )
        for r in results_db
    ]

    return StudentDashboardResponse(
        selected_semester_id=selected_sem_id,
        subject_marks=subject_marks,
        cgpa_history=cgpa_history,
    )


@router.get("/results", response_model=list[ResultRead])
def list_results(current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []
    return db.query(Result).filter(Result.student_id == student.id).all()


@router.get("/results/{result_id}/download", response_model=ResultDownloadResponse)
def download_result(result_id: int, current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    result = db.get(Result, result_id)
    if student is None or result is None or result.student_id != student.id:
        raise HTTPException(status_code=404, detail="Result not found")
    
    url = result.pdf_s3_url
    if url.startswith("file://") or url.startswith("http://") or url.startswith("https://"):
        return ResultDownloadResponse(download_url=url)
        
    try:
        pdf_key = url.split("s3://")[-1].split("/", 1)[-1]
        presigned_url = generate_presigned_download_url(pdf_key)
        return ResultDownloadResponse(download_url=presigned_url)
    except Exception:
        # Fallback to direct url if splitting/parsing fails
        return ResultDownloadResponse(download_url=url)


@router.get("/marks", response_model=list[StudentMarkRead])
def list_marks(semester_id: int | None = None, current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student is None:
        return []

    query = (
        db.query(Mark)
        .filter(Mark.student_id == student.id)
        .join(Mark.examination)
        .join(Mark.subject)
        .join(Student, Student.id == Mark.student_id)
    )
    if semester_id is not None:
        query = query.filter(Mark.examination.has(semester_id=semester_id))

    marks = query.order_by(Mark.id.desc()).all()
    return [
        StudentMarkRead(
            id=mark.id,
            student_id=student.id,
            roll_number=student.roll_number,
            student_name=student.name,
            subject=mark.subject.name,
            semester_id=mark.examination.semester.id,
            semester_number=mark.examination.semester.number,
            branch=student.course.name,
            marks_obtained=mark.marks_obtained,
            max_marks=mark.max_marks,
            examination_type=getattr(mark.examination.exam_type, "value", str(mark.examination.exam_type)),
            exam_date=mark.examination.exam_date,
        )
        for mark in marks
    ]

