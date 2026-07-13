from __future__ import annotations

import pytest
import datetime as dt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.user import User, UserRole
from app.models.student import Student
from app.models.department import Department
from app.models.course import Course
from app.services.account_provisioning import provision_student_account, bulk_provision_from_csv


@pytest.fixture(name="db_session")
def fixture_db_session():
    # Setup in-memory SQLite database
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_provision_student_account_creates_records(db_session):
    # Setup required Department and Course
    dept = Department(name="Computer Science", code="CS")
    db_session.add(dept)
    db_session.commit()

    course = Course(name="B.Tech", department_id=dept.id, duration=4)
    db_session.add(course)
    db_session.commit()

    student, temp_pwd = provision_student_account(
        db=db_session,
        email="test_student@example.com",
        name="John Doe",
        roll_number="CS101",
        department_id=dept.id,
        course_id=course.id,
        current_semester=1,
    )

    assert student.id is not None
    assert temp_pwd != ""
    assert len(temp_pwd) == 12

    # Check User record was created
    user = db_session.query(User).filter(User.email == "test_student@example.com").first()
    assert user is not None
    assert user.role == UserRole.student
    assert user.must_reset_password is True
    assert user.is_active is True


def test_bulk_provision_from_csv_success(db_session):
    # Setup required Department and Course
    dept = Department(name="Computer Science", code="CS")
    db_session.add(dept)
    db_session.commit()

    course = Course(name="B.Tech", department_id=dept.id, duration=4)
    db_session.add(course)
    db_session.commit()

    csv_data = (
        b"name,email,roll_number,department,semester\n"
        b"Alice,alice@example.com,CS102,CS,1\n"
        b"Bob,bob@example.com,CS103,Computer Science,2\n"
    )

    response = bulk_provision_from_csv(db_session, csv_data)
    assert response["success_count"] == 2
    assert response["failure_count"] == 0
    assert len(response["errors"]) == 0

    # Verify Alice is in database
    alice = db_session.query(Student).filter(Student.roll_number == "CS102").first()
    assert alice is not None
    assert alice.name == "Alice"
    assert alice.current_semester == 1

    # Verify Bob is in database
    bob = db_session.query(Student).filter(Student.roll_number == "CS103").first()
    assert bob is not None
    assert bob.name == "Bob"
    assert bob.current_semester == 2


def test_bulk_provision_from_csv_with_failures(db_session):
    # Setup required Department and Course
    dept = Department(name="Computer Science", code="CS")
    db_session.add(dept)
    db_session.commit()

    course = Course(name="B.Tech", department_id=dept.id, duration=4)
    db_session.add(course)
    db_session.commit()

    # Invalid department for second row
    csv_data = (
        b"name,email,roll_number,department,semester\n"
        b"Alice,alice@example.com,CS102,CS,1\n"
        b"Bob,bob@example.com,CS103,MATH,2\n"
    )

    response = bulk_provision_from_csv(db_session, csv_data)
    assert response["success_count"] == 1
    assert response["failure_count"] == 1
    assert len(response["errors"]) == 1
    assert response["errors"][0]["row"] == 2
    assert "MATH" in response["errors"][0]["error"]


def test_provision_student_account_duplicate_detection(db_session):
    # Setup required Department and Course
    dept = Department(name="Computer Science", code="CS")
    db_session.add(dept)
    db_session.commit()

    course = Course(name="B.Tech", department_id=dept.id, duration=4)
    db_session.add(course)
    db_session.commit()

    # First student creation
    provision_student_account(
        db=db_session,
        email="test_student@example.com",
        name="John Doe",
        roll_number="CS101",
        department_id=dept.id,
        course_id=course.id,
        current_semester=1,
    )

    # Test Duplicate Email
    with pytest.raises(ValueError) as exc:
        provision_student_account(
            db=db_session,
            email="test_student@example.com",
            name="Jane Doe",
            roll_number="CS102",
            department_id=dept.id,
            course_id=course.id,
            current_semester=1,
        )
    assert "already in use" in str(exc.value)

    # Test Duplicate Roll Number
    with pytest.raises(ValueError) as exc:
        provision_student_account(
            db=db_session,
            email="other_student@example.com",
            name="Jane Doe",
            roll_number="CS101",
            department_id=dept.id,
            course_id=course.id,
            current_semester=1,
        )
    assert "already in use" in str(exc.value)


def test_bulk_upload_marks_from_csv(db_session):
    from app.models.subject import Subject
    from app.models.semester import Semester
    from app.models.mark import Mark
    from app.models.examination import Examination
    from app.services.account_provisioning import bulk_upload_marks_from_csv

    # Setup Department, Course, Semester, Subject, and Student
    dept = Department(name="Computer Science", code="CS")
    db_session.add(dept)
    db_session.commit()

    course = Course(name="B.Tech", department_id=dept.id, duration=4)
    db_session.add(course)
    db_session.commit()

    semester = Semester(
        course_id=course.id,
        number=1,
        start_date=dt.date.today(),
        end_date=dt.date.today() + dt.timedelta(days=180),
    )
    db_session.add(semester)
    db_session.commit()

    subject = Subject(name="Programming", code="CS101", credits=4, course_id=course.id, semester_number=1)
    db_session.add(subject)
    db_session.commit()

    # Create admin user to enter marks
    admin = User(email="admin@example.com", hashed_password="pwd", role=UserRole.admin, must_reset_password=False)
    db_session.add(admin)
    db_session.commit()

    # Create student profile
    student_user = User(email="student@example.com", hashed_password="pwd", role=UserRole.student, must_reset_password=False)
    db_session.add(student_user)
    db_session.commit()

    student = Student(
        user_id=student_user.id,
        roll_number="CS102",
        name="Alice",
        department_id=dept.id,
        course_id=course.id,
        current_semester=1,
    )
    db_session.add(student)
    db_session.commit()

    csv_data = (
        b"roll_number,subject_code,exam_type,exam_date,marks_obtained,max_marks\n"
        b"CS102,CS101,internal,2026-07-13,45.0,50.0\n"
        b"CS102,CS101,external,2026-07-13,85.0,100.0\n"
    )

    response = bulk_upload_marks_from_csv(db_session, csv_data, admin.id)
    assert response["success_count"] == 2
    assert response["failure_count"] == 0
    assert len(response["errors"]) == 0

    # Verify marks were inserted
    marks = db_session.query(Mark).filter(Mark.student_id == student.id).all()
    assert len(marks) == 2
    assert marks[0].marks_obtained == 45.0
    assert marks[1].marks_obtained == 85.0

