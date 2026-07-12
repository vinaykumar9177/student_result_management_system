from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_role
from app.core.security import get_password_hash
from app.models import Course, Department, Examination, FacultySubject, Result, Semester, Student, Subject, User, UserRole
from app.models.examination import ExamType
from app.models.user import UserRole
from app.schemas.department import DepartmentCreate, DepartmentRead
from app.schemas.user import StudentCreate, StudentRead
from app.services.result_engine import ResultEngine

router = APIRouter(dependencies=[Depends(require_role(UserRole.admin))])


@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.id.desc()).all()


@router.post("/departments", response_model=DepartmentRead)
def create_department(payload: DepartmentCreate, db: Session = Depends(get_db)):
    department = Department(name=payload.name, code=payload.code)
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.put("/departments/{department_id}", response_model=DepartmentRead)
def update_department(department_id: int, payload: DepartmentCreate, db: Session = Depends(get_db)):
    department = db.get(Department, department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    department.name = payload.name
    department.code = payload.code
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


@router.get("/courses")
def list_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@router.post("/courses")
def create_course(payload: dict, db: Session = Depends(get_db)):
    course = Course(name=payload["name"], department_id=payload["department_id"], duration=payload["duration"])
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/subjects")
def list_subjects(db: Session = Depends(get_db)):
    return db.query(Subject).all()


@router.post("/subjects")
def create_subject(payload: dict, db: Session = Depends(get_db)):
    subject = Subject(**payload)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/semesters")
def list_semesters(db: Session = Depends(get_db)):
    return db.query(Semester).all()


@router.post("/semesters")
def create_semester(payload: dict, db: Session = Depends(get_db)):
    semester = Semester(**payload)
    db.add(semester)
    db.commit()
    db.refresh(semester)
    return semester


@router.get("/faculty")
def list_faculty(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == UserRole.faculty).all()


@router.post("/faculty")
def create_faculty(payload: dict, db: Session = Depends(get_db)):
    faculty = User(email=payload["email"], hashed_password=get_password_hash(payload["password"]), role=UserRole.faculty)
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.get("/students", response_model=list[StudentRead])
def list_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@router.post("/students")
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    user = User(email=payload.email, hashed_password=get_password_hash(payload.password), role=UserRole.student)
    db.add(user)
    db.flush()
    student = Student(
        user_id=user.id,
        roll_number=payload.roll_number,
        name=payload.name,
        department_id=payload.department_id,
        course_id=payload.course_id,
        current_semester=payload.current_semester,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/exams")
def list_exams(db: Session = Depends(get_db)):
    return db.query(Examination).all()


@router.post("/exams")
def create_exam(payload: dict, db: Session = Depends(get_db)):
    exam = Examination(subject_id=payload["subject_id"], semester_id=payload["semester_id"], exam_type=ExamType(payload["exam_type"]), exam_date=payload["exam_date"])
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/results/publish")
def publish_results(payload: dict, db: Session = Depends(get_db)):
    semester_id = int(payload["semester_id"])
    student_ids = payload.get("student_ids")
    results = ResultEngine.publish_semester_results(db, semester_id, student_ids)
    return {"published_count": len(results)}


@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    return {
        "students": db.query(Student).count(),
        "subjects": db.query(Subject).count(),
        "results": db.query(Result).count(),
    }


@router.get("/logs")
def logs() -> dict[str, list[dict[str, str]]]:
    return {"entries": [{"level": "INFO", "message": "CloudWatch-compatible structured logging placeholder"}]}
