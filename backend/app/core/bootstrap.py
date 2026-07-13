from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import Course, Department, Examination, Mark, Semester, Student, Subject, User, UserRole
from app.models.examination import ExamType


def seed_demo_data(db: Session) -> None:
    department = db.query(Department).filter(Department.code == "CSE").first()
    if department is None:
        department = Department(name="Computer Science", code="CSE")
        db.add(department)
        db.flush()

    course = db.query(Course).filter(Course.name == "BSc Computer Science").first()
    if course is None:
        course = Course(name="BSc Computer Science", department_id=department.id, duration=3)
        db.add(course)
        db.flush()

    semester = db.query(Semester).filter(Semester.course_id == course.id, Semester.number == 1).first()
    if semester is None:
        semester = Semester(
            course_id=course.id,
            number=1,
            start_date=dt.date.today(),
            end_date=dt.date.today() + dt.timedelta(days=180),
        )
        db.add(semester)
        db.flush()

    subject = db.query(Subject).filter(Subject.name == "Programming Fundamentals").first()
    if subject is None:
        subject = Subject(name="Programming Fundamentals", code="PF101", credits=4, course_id=course.id, semester_number=1)
        db.add(subject)
        db.flush()

    admin = db.query(User).filter(User.email == "admin@demo.com").first()
    if admin is None:
        admin = User(
            email="admin@demo.com",
            hashed_password=get_password_hash("Admin@1234"),
            role=UserRole.admin,
            must_reset_password=False,
        )
        db.add(admin)
        db.flush()
    else:
        admin.role = UserRole.admin
        admin.hashed_password = get_password_hash("Admin@1234")
        admin.must_reset_password = False

    student_user = db.query(User).filter(User.email == "student@demo.com").first()
    if student_user is None:
        student_user = User(
            email="student@demo.com",
            hashed_password=get_password_hash("Student@1234"),
            role=UserRole.student,
            must_reset_password=False,
        )
        db.add(student_user)
        db.flush()
    else:
        student_user.must_reset_password = False

    student = db.query(Student).filter(Student.user_id == student_user.id).first()
    if student is None:
        student = Student(
            user_id=student_user.id,
            roll_number="CSE-001",
            name="Demo Student",
            department_id=department.id,
            course_id=course.id,
            current_semester=1,
        )
        db.add(student)
        db.flush()

    examination = db.query(Examination).filter(Examination.subject_id == subject.id, Examination.semester_id == semester.id).first()
    if examination is None:
        examination = Examination(
            subject_id=subject.id,
            semester_id=semester.id,
            exam_type=ExamType.internal,
            exam_date=dt.date.today(),
        )
        db.add(examination)
        db.flush()

    existing_mark = db.query(Mark).filter(Mark.student_id == student.id, Mark.subject_id == subject.id, Mark.examination_id == examination.id).first()
    if existing_mark is None:
        db.add(
            Mark(
                student_id=student.id,
                subject_id=subject.id,
                examination_id=examination.id,
                marks_obtained=84,
                max_marks=100,
                entered_by_admin_id=admin.id,
            )
        )

    db.commit()