from __future__ import annotations

import csv
import io
import logging
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.student import Student
from app.models.department import Department
from app.models.course import Course
from app.core.security import generate_temporary_password, get_password_hash
from app.services.sns_client import publish_email_notification

logger = logging.getLogger(__name__)


def provision_student_account(
    db: Session,
    email: str,
    name: str,
    roll_number: str,
    department_id: int,
    course_id: int,
    current_semester: int,
) -> tuple[Student, str]:
    # Check for duplicates
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        if existing_user.is_active:
            raise ValueError(f"Email '{email}' is already in use")
        else:
            # Re-activate soft-deleted user
            temp_password = generate_temporary_password()
            existing_user.is_active = True
            existing_user.hashed_password = get_password_hash(temp_password)
            existing_user.must_reset_password = True
            db.add(existing_user)
            db.flush()
            
            student = db.query(Student).filter(Student.user_id == existing_user.id).first()
            
            # Check roll number uniqueness for active students
            other_student = db.query(Student).join(User, Student.user_id == User.id).filter(
                Student.roll_number == roll_number,
                User.is_active == True,
                Student.id != (student.id if student else 0)
            ).first()
            if other_student:
                raise ValueError(f"Roll number '{roll_number}' is already in use")
            
            if student:
                student.roll_number = roll_number
                student.name = name
                student.department_id = department_id
                student.course_id = course_id
                student.current_semester = current_semester
            else:
                student = Student(
                    user_id=existing_user.id,
                    roll_number=roll_number,
                    name=name,
                    department_id=department_id,
                    course_id=course_id,
                    current_semester=current_semester
                )
            db.add(student)
            db.flush()
            
            # Send credentials email
            subject = "Welcome to the Student Result Portal - Account Re-activated"
            message = (
                f"Dear {name},\n\n"
                f"Your student portal account has been successfully re-activated.\n\n"
                f"Credentials:\n"
                f"Username (Email): {email}\n"
                f"Temporary Password: {temp_password}\n\n"
                f"Please log in at the portal and update your password immediately."
            )
            publish_email_notification(subject, message, email)
            return student, temp_password

    # Normal duplicate check for roll number
    other_student = db.query(Student).join(User, Student.user_id == User.id).filter(
        Student.roll_number == roll_number,
        User.is_active == True
    ).first()
    if other_student:
        raise ValueError(f"Roll number '{roll_number}' is already in use")

    # Generate cryptographic random temp password
    temp_password = generate_temporary_password()

    # Create User
    user = User(
        email=email,
        hashed_password=get_password_hash(temp_password),
        role=UserRole.student,
        must_reset_password=True,
        is_active=True,
    )
    db.add(user)
    db.flush()

    # Create Student
    student = Student(
        user_id=user.id,
        roll_number=roll_number,
        name=name,
        department_id=department_id,
        course_id=course_id,
        current_semester=current_semester,
    )
    db.add(student)
    db.flush()

    # Send SNS email notification with credentials
    subject = "Welcome to the Student Result Portal - Account Created"
    message = (
        f"Dear {name},\n\n"
        f"Your student portal account has been successfully created.\n\n"
        f"Credentials:\n"
        f"Username (Email): {email}\n"
        f"Temporary Password: {temp_password}\n\n"
        f"Please log in at the portal and update your password immediately."
    )
    publish_email_notification(subject, message, email)

    return student, temp_password


def bulk_provision_from_csv(db: Session, csv_content_bytes: bytes) -> dict:
    # Decode CSV content bytes
    csv_text = csv_content_bytes.decode("utf-8-sig", errors="ignore")
    csv_file = io.StringIO(csv_text)
    reader = csv.DictReader(csv_file)

    success_count = 0
    failure_count = 0
    errors = []

    # Case-insensitive header matching
    headers = {k.strip().lower(): k for k in reader.fieldnames or []}

    name_key = next((headers[k] for k in ["name"] if k in headers), None)
    email_key = next((headers[k] for k in ["email"] if k in headers), None)
    roll_key = next((headers[k] for k in ["roll_number", "roll number", "roll"] if k in headers), None)
    dept_key = next((headers[k] for k in ["department", "dept"] if k in headers), None)
    sem_key = next((headers[k] for k in ["semester", "sem"] if k in headers), None)

    if not all([name_key, email_key, roll_key, dept_key, sem_key]):
        missing = []
        if not name_key: missing.append("name")
        if not email_key: missing.append("email")
        if not roll_key: missing.append("roll_number")
        if not dept_key: missing.append("department")
        if not sem_key: missing.append("semester")
        return {
            "success_count": 0,
            "failure_count": 0,
            "errors": [{"row": 0, "error": f"Missing CSV columns: {', '.join(missing)}"}],
        }

    for idx, row in enumerate(reader, start=1):
        try:
            name = row[name_key].strip()
            email = row[email_key].strip()
            roll_number = row[roll_key].strip()
            dept_val = row[dept_key].strip()
            sem_val = row[sem_key].strip()

            if not name or not email or not roll_number or not dept_val or not sem_val:
                raise ValueError("Row contains empty fields")

            # Parse semester
            try:
                current_semester = int(sem_val)
            except ValueError:
                raise ValueError(f"Invalid semester format: '{sem_val}' is not an integer")

            # Map department code or name to department_id
            dept = db.query(Department).filter(
                (Department.code == dept_val) | (Department.name == dept_val)
            ).first()
            if not dept:
                raise ValueError(f"Department '{dept_val}' not found in database")

            # Resolve course_id (if a course exists in that department or pick the first course)
            course = db.query(Course).filter(Course.department_id == dept.id).first()
            if not course:
                course = db.query(Course).first()
                if not course:
                    raise ValueError(f"No courses found in database to assign to student")

            # Call provision_student_account with a nested transaction savepoint
            with db.begin_nested():
                student, temp_pwd = provision_student_account(
                    db=db,
                    email=email,
                    name=name,
                    roll_number=roll_number,
                    department_id=dept.id,
                    course_id=course.id,
                    current_semester=current_semester,
                )
            success_count += 1

        except Exception as exc:
            failure_count += 1
            errors.append({"row": idx, "error": str(exc)})
            logger.error("Failed to provision student at row %d: %s", idx, exc)

    # Commit successful transactions
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        return {
            "success_count": 0,
            "failure_count": success_count + failure_count,
            "errors": [{"row": 0, "error": f"Database commit failed: {str(exc)}"}],
        }

    return {
        "success_count": success_count,
        "failure_count": failure_count,
        "errors": errors,
    }


def bulk_upload_marks_from_csv(db: Session, csv_content_bytes: bytes, entered_by_admin_id: int) -> dict:
    import datetime as dt
    from app.models.subject import Subject
    from app.models.examination import Examination, ExamType
    from app.models.semester import Semester
    from app.models.mark import Mark
    from app.models.notification import Notification

    # Decode CSV content bytes
    csv_text = csv_content_bytes.decode("utf-8-sig", errors="ignore")
    csv_file = io.StringIO(csv_text)
    reader = csv.DictReader(csv_file)

    success_count = 0
    failure_count = 0
    errors = []

    # Case-insensitive header matching
    headers = {k.strip().lower(): k for k in reader.fieldnames or []}

    roll_key = next((headers[k] for k in ["roll_number", "roll number", "roll"] if k in headers), None)
    subj_key = next((headers[k] for k in ["subject_code", "subject code", "subject", "code"] if k in headers), None)
    type_key = next((headers[k] for k in ["exam_type", "exam type", "type"] if k in headers), None)
    date_key = next((headers[k] for k in ["exam_date", "exam date", "date"] if k in headers), None)
    marks_key = next((headers[k] for k in ["marks_obtained", "marks obtained", "marks", "score"] if k in headers), None)
    max_key = next((headers[k] for k in ["max_marks", "max marks", "max"] if k in headers), None)

    if not all([roll_key, subj_key, type_key, marks_key, max_key]):
        missing = []
        if not roll_key: missing.append("roll_number")
        if not subj_key: missing.append("subject_code")
        if not type_key: missing.append("exam_type")
        if not marks_key: missing.append("marks_obtained")
        if not max_key: missing.append("max_marks")
        return {
            "success_count": 0,
            "failure_count": 0,
            "errors": [{"row": 0, "error": f"Missing CSV columns: {', '.join(missing)}"}],
        }

    for idx, row in enumerate(reader, start=1):
        try:
            roll_number = row[roll_key].strip()
            subject_code = row[subj_key].strip()
            exam_type_str = row[type_key].strip().lower()
            marks_obtained_str = row[marks_key].strip()
            max_marks_str = row[max_key].strip()
            exam_date_str = row[date_key].strip() if date_key else None

            if not roll_number or not subject_code or not exam_type_str or not marks_obtained_str or not max_marks_str:
                raise ValueError("Row contains empty fields")

            # Validate scores
            try:
                marks_obtained = float(marks_obtained_str)
                max_marks = float(max_marks_str)
            except ValueError:
                raise ValueError(f"Marks must be numbers: obtained={marks_obtained_str}, max={max_marks_str}")

            if marks_obtained < 0 or max_marks <= 0 or marks_obtained > max_marks:
                raise ValueError(f"Invalid mark values: obtained={marks_obtained}, max={max_marks}")

            # Parse exam type
            if "internal" in exam_type_str:
                exam_type = ExamType.internal
            elif "external" in exam_type_str:
                exam_type = ExamType.external
            else:
                raise ValueError(f"Invalid exam type '{exam_type_str}': must be 'internal' or 'external'")

            # Parse date or default to today
            exam_date = dt.date.today()
            if exam_date_str:
                try:
                    exam_date = dt.datetime.strptime(exam_date_str, "%Y-%m-%d").date()
                except ValueError:
                    try:
                        exam_date = dt.datetime.strptime(exam_date_str, "%d-%m-%Y").date()
                    except ValueError:
                        raise ValueError(f"Invalid date format '{exam_date_str}': use YYYY-MM-DD")

            # Lookups
            student = db.query(Student).filter(Student.roll_number == roll_number).first()
            if not student:
                raise ValueError(f"Student with roll number '{roll_number}' not found")

            subject = db.query(Subject).filter((Subject.code == subject_code) | (Subject.name == subject_code)).first()
            if not subject:
                raise ValueError(f"Subject with code/name '{subject_code}' not found")

            # Find semester
            semester = db.query(Semester).filter(
                Semester.course_id == student.course_id,
                Semester.number == student.current_semester
            ).first()
            if not semester:
                raise ValueError(f"No semester #{student.current_semester} configured for student's course")

            # Find or create examination
            examination = db.query(Examination).filter(
                Examination.subject_id == subject.id,
                Examination.semester_id == semester.id,
                Examination.exam_type == exam_type
            ).first()

            if not examination:
                examination = Examination(
                    subject_id=subject.id,
                    semester_id=semester.id,
                    exam_type=exam_type,
                    exam_date=exam_date
                )
                db.add(examination)
                db.flush()

            # Find existing mark record to update or insert
            mark = db.query(Mark).filter(
                Mark.student_id == student.id,
                Mark.subject_id == subject.id,
                Mark.examination_id == examination.id
            ).first()

            with db.begin_nested():
                if mark:
                    mark.marks_obtained = marks_obtained
                    mark.max_marks = max_marks
                    mark.entered_by_admin_id = entered_by_admin_id
                else:
                    mark = Mark(
                        student_id=student.id,
                        subject_id=subject.id,
                        examination_id=examination.id,
                        marks_obtained=marks_obtained,
                        max_marks=max_marks,
                        entered_by_admin_id=entered_by_admin_id
                    )
                    db.add(mark)
                
                # Add notification
                db.add(
                    Notification(
                        user_id=student.user_id,
                        message=f"Marks updated for subject {subject.name} ({exam_type.value}). Score: {marks_obtained}/{max_marks}.",
                        type="mark_posted"
                    )
                )
            
            success_count += 1
        except Exception as exc:
            failure_count += 1
            errors.append({"row": idx, "error": str(exc)})
            logger.error("Failed to upload mark at row %d: %s", idx, exc)

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        return {
            "success_count": 0,
            "failure_count": success_count + failure_count,
            "errors": [{"row": 0, "error": f"Database commit failed: {str(exc)}"}],
        }

    return {
        "success_count": success_count,
        "failure_count": failure_count,
        "errors": errors,
    }

