from __future__ import annotations
import datetime as dt
import random
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Course, Department, Examination, Mark, Semester, Student, Subject, User, UserRole
from app.models.examination import ExamType
from app.services.result_engine import ResultEngine

def main():
    db: Session = SessionLocal()
    try:
        # Get the course
        course = db.query(Course).filter(Course.name == "BSc Computer Science").first()
        if not course:
            print("BSc Computer Science course not found!")
            return

        # Get the admin
        admin = db.query(User).filter(User.email == "admin@demo.com").first()
        if not admin:
            print("Admin user not found!")
            return

        # Get the student
        student = db.query(Student).filter(Student.roll_number == "CSE-001").first()
        if not student:
            print("Demo student not found!")
            return

        # Define subjects for each semester
        # Sem 1 to 4
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
            print(f"Seeding semester {sem_num}...")
            # Check or create Semester record
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
                # Check or create Subject record
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

                # For each subject, create an "internal" and "external" exam if they don't exist
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

                    # Create Mark record
                    mark = db.query(Mark).filter(
                        Mark.student_id == student.id,
                        Mark.subject_id == subject.id,
                        Mark.examination_id == exam.id
                    ).first()

                    # Set a randomized score between 65% and 98%
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
                        mark.marks_obtained = obt_score
                        mark.max_marks = max_score

            db.commit()

            # Publish results for the semester using ResultEngine
            print(f"Publishing results for semester {sem_num}...")
            ResultEngine.publish_semester_results(db, semester.id, [student.id])

        # Set student's current semester to 5
        student.current_semester = 5
        db.commit()
        print("Successfully seeded all dummy data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
