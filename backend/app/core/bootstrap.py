from __future__ import annotations

import datetime as dt
import random

from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models import Course, Department, Examination, Mark, Semester, Student, Subject, User, UserRole
from app.models.examination import ExamType
from app.services.result_engine import ResultEngine


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
        student_user.role = UserRole.student
        student_user.hashed_password = get_password_hash("Student@1234")
        student_user.must_reset_password = False

    student = db.query(Student).filter(Student.user_id == student_user.id).first()
    if student is None:
        student = Student(
            user_id=student_user.id,
            roll_number="CSE-001",
            name="Demo Student",
            department_id=department.id,
            course_id=course.id,
            current_semester=5,
        )
        db.add(student)
        db.flush()
    else:
        student.current_semester = 5

    # Define subjects for semesters 1 to 4
    semester_data = {
        1: [
            ("Programming Fundamentals", "PF101", 4),
            ("Calculus & Analytical Geometry", "MTH101", 4),
            ("Digital Logic Design", "DLD101", 3),
            ("Communication Skills", "ENG101", 3)
        ],
        2: [
            ("Object Oriented Programming", "OOP102", 4),
            ("Discrete Mathematics", "MTH102", 3),
            ("Computer Architecture", "COA102", 4),
            ("Technical Writing", "ENG102", 3)
        ],
        3: [
            ("Data Structures & Algorithms", "DSA201", 4),
            ("Database Systems", "DBMS201", 4),
            ("Linear Algebra", "MTH201", 3),
            ("Software Engineering", "SE201", 3)
        ],
        4: [
            ("Operating Systems", "OS202", 4),
            ("Computer Networks", "CN202", 4),
            ("Probability & Statistics", "MTH202", 3),
            ("Artificial Intelligence", "AI202", 4)
        ]
    }

    # Seed data for each semester
    for sem_num, subjects_list in semester_data.items():
        semester = db.query(Semester).filter(Semester.course_id == course.id, Semester.number == sem_num).first()
        if not semester:
            semester = Semester(
                course_id=course.id,
                number=sem_num,
                start_date=dt.date(2026 - (5 - sem_num), 9, 1),
                end_date=dt.date(2026 - (5 - sem_num), 2, 28) if sem_num % 2 == 1 else dt.date(2026 - (4 - sem_num), 6, 30)
            )
            db.add(semester)
            db.flush()

        for name, code, credits in subjects_list:
            subject = db.query(Subject).filter(Subject.code == code).first()
            if not subject:
                subject = Subject(
                    name=name,
                    code=code,
                    credits=credits,
                    course_id=course.id,
                    semester_number=sem_num
                )
                db.add(subject)
                db.flush()

            for etype in [ExamType.internal, ExamType.external]:
                exam = db.query(Examination).filter(
                    Examination.subject_id == subject.id,
                    Examination.semester_id == semester.id,
                    Examination.exam_type == etype
                ).first()
                if not exam:
                    exam = Examination(
                        subject_id=subject.id,
                        semester_id=semester.id,
                        exam_type=etype,
                        exam_date=dt.date.today() - dt.timedelta(days=30 * (5 - sem_num))
                    )
                    db.add(exam)
                    db.flush()

                mark = db.query(Mark).filter(
                    Mark.student_id == student.id,
                    Mark.subject_id == subject.id,
                    Mark.examination_id == exam.id
                ).first()

                max_score = 50.0 if etype == ExamType.internal else 100.0
                obt_score = round(random.uniform(0.65, 0.98) * max_score, 1)

                if not mark:
                    mark = Mark(
                        student_id=student.id,
                        subject_id=subject.id,
                        examination_id=exam.id,
                        marks_obtained=obt_score,
                        max_marks=max_score,
                        entered_by_admin_id=admin.id
                    )
                    db.add(mark)
                else:
                    pass

        db.commit()

        # Publish results if they do not exist
        from app.models import Result
        existing_result = db.query(Result).filter(Result.student_id == student.id, Result.semester_id == semester.id).first()
        if not existing_result:
            ResultEngine.publish_semester_results(db, semester.id, [student.id])

    db.commit()