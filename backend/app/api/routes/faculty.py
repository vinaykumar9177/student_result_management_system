from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_role
from app.models import FacultySubject, Mark, Student, Subject, UserRole
from app.models.examination import Examination

router = APIRouter(dependencies=[Depends(require_role(UserRole.faculty))])


@router.get("/subjects")
def faculty_subjects(db: Session = Depends(get_db)):
    return db.query(FacultySubject).all()


@router.get("/students")
def faculty_students(db: Session = Depends(get_db)):
    return db.query(Student).all()


@router.post("/marks")
def create_mark(payload: dict, db: Session = Depends(get_db)):
    mark = Mark(**payload)
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark


@router.put("/marks/{mark_id}")
def update_mark(mark_id: int, payload: dict, db: Session = Depends(get_db)):
    mark = db.get(Mark, mark_id)
    if mark is None:
        raise HTTPException(status_code=404, detail="Mark not found")
    for key, value in payload.items():
        setattr(mark, key, value)
    db.commit()
    db.refresh(mark)
    return mark


@router.post("/marks/submit")
def submit_marks(payload: dict, db: Session = Depends(get_db)):
    mark_ids = payload.get("mark_ids", [])
    marks = db.query(Mark).filter(Mark.id.in_(mark_ids)).all()
    for mark in marks:
        mark.submitted_at = payload.get("submitted_at")
    db.commit()
    return {"submitted_count": len(marks)}
