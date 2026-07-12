from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import Course, Department, Semester, Student, User, UserRole


def seed_demo_data(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    department = Department(name="Computer Science", code="CSE")
    db.add(department)
    db.flush()

    course = Course(name="BSc Computer Science", department_id=department.id, duration=3)
    db.add(course)
    db.flush()

    semester = Semester(
        course_id=course.id,
        number=1,
        start_date=dt.date.today(),
        end_date=dt.date.today() + dt.timedelta(days=180),
    )
    db.add(semester)
    db.flush()

    admin = User(
        email="admin@demo.local",
        hashed_password=get_password_hash("Admin@1234"),
        role=UserRole.admin,
    )
    teacher = User(
        email="teacher@demo.local",
        hashed_password=get_password_hash("Teacher@1234"),
        role=UserRole.faculty,
    )
    student_user = User(
        email="student@demo.local",
        hashed_password=get_password_hash("Student@1234"),
        role=UserRole.student,
    )
    db.add_all([admin, teacher, student_user])
    db.flush()

    student = Student(
        user_id=student_user.id,
        roll_number="CSE-001",
        name="Demo Student",
        department_id=department.id,
        course_id=course.id,
        current_semester=1,
    )
    db.add(student)
    db.commit()