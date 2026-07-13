from __future__ import annotations

import csv
import datetime as dt
import io
import secrets

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_role
from app.core.security import get_password_hash
from app.models import Course, Department, Examination, Mark, Notification, Result, Semester, Student, Subject, User, UserRole
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.schemas.examination import ExaminationCreate, ExaminationRead, ExaminationUpdate
from app.schemas.mark import MarkCreate, MarkRead, MarkUpdate
from app.schemas.semester import SemesterCreate, SemesterRead, SemesterUpdate
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate
from app.schemas.user import (
    BulkCreateResponse,
    StudentAccountCreateResponse,
    StudentAccountRead,
    StudentCreate,
    StudentMarkRead,
    StudentUpdate,
)
from app.services.account_provisioning import (
    bulk_provision_from_csv,
    bulk_upload_marks_from_csv,
    provision_student_account,
)
from app.services.result_engine import ResultEngine
from app.services.sns_client import publish_email_notification
from pydantic import BaseModel

router = APIRouter(dependencies=[Depends(require_role(UserRole.admin))])


def _temporary_password() -> str:
    return f"Stu-{secrets.token_urlsafe(8)}"


def _student_read(student: Student) -> StudentAccountRead:
    return StudentAccountRead(
        id=student.id,
        user_id=student.user_id,
        email=student.user.email,
        roll_number=student.roll_number,
        name=student.name,
        department_id=student.department_id,
        course_id=student.course_id,
        current_semester=student.current_semester,
    )


def _mark_read(mark: Mark) -> StudentMarkRead:
    exam = mark.examination
    semester = exam.semester
    student = mark.student
    subject = mark.subject
    return StudentMarkRead(
        id=mark.id,
        student_id=student.id,
        roll_number=student.roll_number,
        student_name=student.name,
        subject=subject.name,
        semester_id=semester.id,
        semester_number=semester.number,
        branch=student.course.name,
        marks_obtained=mark.marks_obtained,
        max_marks=mark.max_marks,
        examination_type=getattr(exam.exam_type, "value", str(exam.exam_type)),
        exam_date=exam.exam_date,
    )


# ----------------- DEPARTMENTS CRUD -----------------
@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.id.desc()).all()


@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    department = Department(name=payload.name, code=payload.code)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.put("/departments/{department_id}", response_model=DepartmentRead)
def update_department(department_id: int, payload: DepartmentUpdate, db: Session = Depends(get_db)):
    department = db.get(Department, department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(department, key, val)
    db.commit()
    db.refresh(department)
    return department


@router.delete("/departments/{department_id}")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    department = db.get(Department, department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(department)
    db.commit()
    return {"message": "Department deleted"}


# ----------------- COURSES CRUD -----------------
@router.get("/courses", response_model=list[CourseRead])
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).order_by(Course.id.desc()).all()


@router.post("/courses", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    course = Course(name=payload.name, department_id=payload.department_id, duration=payload.duration)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/courses/{course_id}", response_model=CourseRead)
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(course, key, val)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}


# ----------------- SUBJECTS CRUD -----------------
@router.get("/subjects", response_model=list[SubjectRead])
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).order_by(Subject.id.desc()).all()


@router.post("/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db)):
    subject = Subject(
        name=payload.name,
        code=payload.code,
        credits=payload.credits,
        course_id=payload.course_id,
        semester_number=payload.semester_number,
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.put("/subjects/{subject_id}", response_model=SubjectRead)
def update_subject(subject_id: int, payload: SubjectUpdate, db: Session = Depends(get_db)):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(subject, key, val)
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/subjects/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted"}


# ----------------- SEMESTERS CRUD -----------------
@router.get("/semesters", response_model=list[SemesterRead])
def list_semesters(db: Session = Depends(get_db)):
    return db.query(Semester).order_by(Semester.id.desc()).all()


@router.post("/semesters", response_model=SemesterRead, status_code=status.HTTP_201_CREATED)
def create_semester(payload: SemesterCreate, db: Session = Depends(get_db)):
    semester = Semester(
        course_id=payload.course_id,
        number=payload.number,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester


@router.put("/semesters/{semester_id}", response_model=SemesterRead)
def update_semester(semester_id: int, payload: SemesterUpdate, db: Session = Depends(get_db)):
    semester = db.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(semester, key, val)
    db.commit()
    db.refresh(semester)
    return semester


@router.delete("/semesters/{semester_id}")
def delete_semester(semester_id: int, db: Session = Depends(get_db)):
    semester = db.get(Semester, semester_id)
    if semester is None:
        raise HTTPException(status_code=404, detail="Semester not found")
    db.delete(semester)
    db.commit()
    return {"message": "Semester deleted"}


# ----------------- EXAMINATIONS CRUD -----------------
@router.get("/examinations", response_model=list[ExaminationRead])
def list_examinations(db: Session = Depends(get_db)):
    return db.query(Examination).order_by(Examination.id.desc()).all()


@router.post("/examinations", response_model=ExaminationRead, status_code=status.HTTP_201_CREATED)
def create_examination(payload: ExaminationCreate, db: Session = Depends(get_db)):
    examination = Examination(
        subject_id=payload.subject_id,
        semester_id=payload.semester_id,
        exam_type=payload.exam_type,
        exam_date=payload.exam_date,
    )
    db.add(examination)
    db.commit()
    db.refresh(examination)
    return examination


@router.put("/examinations/{examination_id}", response_model=ExaminationRead)
def update_examination(examination_id: int, payload: ExaminationUpdate, db: Session = Depends(get_db)):
    examination = db.get(Examination, examination_id)
    if examination is None:
        raise HTTPException(status_code=404, detail="Examination not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(examination, key, val)
    db.commit()
    db.refresh(examination)
    return examination


@router.delete("/examinations/{examination_id}")
def delete_examination(examination_id: int, db: Session = Depends(get_db)):
    examination = db.get(Examination, examination_id)
    if examination is None:
        raise HTTPException(status_code=404, detail="Examination not found")
    db.delete(examination)
    db.commit()
    return {"message": "Examination deleted"}


# ----------------- STUDENTS CRUD -----------------
@router.get("/students", response_model=list[StudentAccountRead])
def list_students(db: Session = Depends(get_db)):
    students = db.query(Student).join(User, Student.user_id == User.id).filter(User.is_active == True).order_by(Student.id.desc()).all()
    return [_student_read(student) for student in students]


@router.post("/students", response_model=StudentAccountCreateResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    try:
        # provision_student_account handles normal provisioning as well as soft-deleted user re-activation
        student, temp_password = provision_student_account(
            db=db,
            email=payload.email,
            name=payload.name,
            roll_number=payload.roll_number,
            department_id=payload.department_id,
            course_id=payload.course_id,
            current_semester=payload.current_semester
        )
        db.commit()
        db.refresh(student)
        return StudentAccountCreateResponse(student=_student_read(student), temporary_password=temp_password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/students/bulk", response_model=BulkCreateResponse)
def bulk_provision_students(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = file.file.read()

    # Extract roll numbers for query afterwards
    csv_text = content.decode("utf-8-sig", errors="ignore")
    csv_file = io.StringIO(csv_text)
    reader = csv.DictReader(csv_file)
    headers = {k.strip().lower(): k for k in reader.fieldnames or []}
    roll_key = next((headers[k] for k in ["roll_number", "roll number", "roll"] if k in headers), None)
    roll_numbers = []
    if roll_key:
        for row in reader:
            val = row.get(roll_key)
            if val:
                roll_numbers.append(val.strip())

    res = bulk_provision_from_csv(db, content)

    # Query matching successfully created student records
    students_db = []
    if roll_numbers:
        students_db = db.query(Student).filter(Student.roll_number.in_(roll_numbers)).all()

    errors_list = [f"Row {e['row']}: {e['error']}" for e in res.get("errors", [])]
    return BulkCreateResponse(
        success_count=res.get("success_count", 0),
        errors=errors_list,
        students=[_student_read(s) for s in students_db],
    )


@router.put("/students/{student_id}", response_model=StudentAccountRead)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(student, key, val)
    db.commit()
    db.refresh(student)
    return _student_read(student)


@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.get(User, student.user_id)
    if user is not None:
        user.is_active = False
        db.add(user)
    db.commit()
    return {"message": "Student account soft-deleted"}


@router.post("/students/{student_id}/reset-password")
def reset_student_password(student_id: int, db: Session = Depends(get_db)):
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.get(User, student.user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Student account not found")

    temp_password = _temporary_password()
    user.hashed_password = get_password_hash(temp_password)
    user.must_reset_password = True
    db.add(Notification(user_id=user.id, message="Your password has been reset by the admin.", type="password_reset"))
    db.commit()

    publish_email_notification(
        subject="Password reset",
        message=(
            f"Your password has been reset by the admin.\n"
            f"Email: {user.email}\n"
            f"Temporary password: {temp_password}\n"
            "Use this password to sign in, then change it from your account page."
        ),
        email=user.email,
    )
    return {"temporary_password": temp_password}


# ----------------- MARKS CRUD -----------------
@router.get("/marks", response_model=list[StudentMarkRead])
def list_marks(db: Session = Depends(get_db)):
    marks = db.query(Mark).order_by(Mark.id.desc()).all()
    return [_mark_read(mark) for mark in marks]


@router.post("/marks/bulk", response_model=BulkCreateResponse)
def bulk_upload_marks(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    content = file.file.read()
    res = bulk_upload_marks_from_csv(db, content, current_user.id)
    errors_list = [f"Row {e['row']}: {e['error']}" for e in res.get("errors", [])]
    return BulkCreateResponse(
        success_count=res.get("success_count", 0),
        errors=errors_list,
        students=[],
    )


@router.post("/marks", response_model=StudentMarkRead, status_code=status.HTTP_201_CREATED)
def create_mark(
    payload: MarkCreate,
    current_user: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    mark = Mark(
        student_id=payload.student_id,
        subject_id=payload.subject_id,
        examination_id=payload.examination_id,
        marks_obtained=payload.marks_obtained,
        max_marks=payload.max_marks,
        entered_by_admin_id=current_user.id,
    )
    db.add(mark)

    student = db.get(Student, payload.student_id)
    if student is not None:
        db.add(
            Notification(
                user_id=student.user_id,
                message=f"A new mark has been posted for roll number {student.roll_number}.",
                type="mark_posted",
            )
        )

    db.commit()
    db.refresh(mark)

    if student is not None:
        publish_email_notification(
            subject="New mark posted",
            message=f"A new mark has been posted for {student.name} ({student.roll_number}). Sign in to view the details.",
            email=student.user.email,
        )
    return _mark_read(mark)


@router.put("/marks/{mark_id}", response_model=StudentMarkRead)
def update_mark(
    mark_id: int,
    payload: MarkUpdate,
    current_user: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
):
    mark = db.get(Mark, mark_id)
    if mark is None:
        raise HTTPException(status_code=404, detail="Mark not found")
    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(mark, key, val)
    mark.entered_by_admin_id = current_user.id

    student = db.get(Student, mark.student_id)
    if student is not None:
        db.add(
            Notification(
                user_id=student.user_id,
                message=f"A mark has been updated for roll number {student.roll_number}.",
                type="mark_updated",
            )
        )

    db.commit()
    db.refresh(mark)

    if student is not None:
        publish_email_notification(
            subject="Mark updated",
            message=f"A mark has been updated for {student.name} ({student.roll_number}). Sign in to review the revised score.",
            email=student.user.email,
        )
    return _mark_read(mark)


@router.delete("/marks/{mark_id}")
def delete_mark(mark_id: int, db: Session = Depends(get_db)):
    mark = db.get(Mark, mark_id)
    if mark is None:
        raise HTTPException(status_code=404, detail="Mark not found")
    db.delete(mark)
    db.commit()
    return {"message": "Mark deleted"}


# ----------------- RESULTS PUBLISHING -----------------
class ResultsPublishRequest(BaseModel):
    semester_id: int
    student_ids: list[int] | None = None


class ResultsPublishResponse(BaseModel):
    published_count: int


@router.post("/results/publish", response_model=ResultsPublishResponse)
def publish_results(payload: ResultsPublishRequest, db: Session = Depends(get_db)):
    results = ResultEngine.publish_semester_results(db, payload.semester_id, payload.student_ids)
    return ResultsPublishResponse(published_count=len(results))


# ----------------- ANALYTICS & LOGS -----------------
class PerformanceMetric(BaseModel):
    course_id: int
    course_name: str
    semester_id: int
    semester_number: int
    avg_percentage: float
    avg_sgpa: float
    result_count: int


class AnalyticsResponse(BaseModel):
    students_count: int
    courses_count: int
    subjects_count: int
    departments_count: int
    results_count: int
    performance_by_branch_semester: list[PerformanceMetric]


@router.get("/analytics", response_model=AnalyticsResponse)
def analytics(db: Session = Depends(get_db)):
    perf_data = (
        db.query(
            Student.course_id,
            Course.name.label("course_name"),
            Result.semester_id,
            Semester.number.label("semester_number"),
            func.avg(Result.percentage).label("avg_percentage"),
            func.avg(Result.sgpa).label("avg_sgpa"),
            func.count(Result.id).label("result_count"),
        )
        .select_from(Result)
        .join(Student, Student.id == Result.student_id)
        .join(Course, Course.id == Student.course_id)
        .join(Semester, Semester.id == Result.semester_id)
        .group_by(Student.course_id, Course.name, Result.semester_id, Semester.number)
        .all()
    )

    metrics = [
        PerformanceMetric(
            course_id=row.course_id,
            course_name=row.course_name,
            semester_id=row.semester_id,
            semester_number=row.semester_number,
            avg_percentage=round(float(row.avg_percentage), 2),
            avg_sgpa=round(float(row.avg_sgpa), 2),
            result_count=row.result_count,
        )
        for row in perf_data
    ]

    return AnalyticsResponse(
        students_count=db.query(Student).count(),
        courses_count=db.query(Course).count(),
        subjects_count=db.query(Subject).count(),
        departments_count=db.query(Department).count(),
        results_count=db.query(Result).count(),
        performance_by_branch_semester=metrics,
    )


class LogEntry(BaseModel):
    timestamp: str
    level: str
    message: str


class LogsResponse(BaseModel):
    entries: list[LogEntry]


@router.get("/logs", response_model=LogsResponse)
def logs() -> LogsResponse:
    # return last 50 lines of system logs (simulated)
    mock_entries = []
    events = [
        ("INFO", "Database connection established successfully."),
        ("INFO", "FastAPI app started and listening on port 8000."),
        ("INFO", "AWS S3 client initialized for bucket."),
        ("INFO", "AWS SNS notification topic verified."),
        ("INFO", "Admin user authenticated."),
        ("INFO", "User login request received."),
        ("INFO", "JWT token issued successfully."),
        ("INFO", "New department created."),
        ("INFO", "New course added: Computer Science."),
        ("INFO", "Student accounts provisioned via CSV bulk upload."),
        ("INFO", "Notification sent via SNS to student: Welcome to Portal."),
        ("INFO", "Mark posted for student."),
        ("INFO", "Published semester results successfully."),
        ("WARNING", "Slow query detected on results aggregation."),
        ("INFO", "S3 pre-signed URL generated for download."),
        ("INFO", "Result computation engine executed for semester."),
    ]
    for i in range(50):
        evt = events[i % len(events)]
        mock_entries.append(
            LogEntry(
                timestamp=(dt.datetime.now() - dt.timedelta(seconds=(50 - i) * 10)).isoformat(),
                level=evt[0],
                message=f"[Line {i}] {evt[1]}",
            )
        )
    return LogsResponse(entries=mock_entries)

