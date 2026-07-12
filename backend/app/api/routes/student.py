from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user, get_db, require_role
from app.models import Result, Student, UserRole
from app.services.s3_client import generate_presigned_download_url

router = APIRouter(dependencies=[Depends(require_role(UserRole.student))])


@router.get("/profile")
def get_profile(current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/results")
def list_results(current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    return db.query(Result).filter(Result.student_id == student.id).all() if student else []


@router.get("/results/{semester_id}")
def get_result_by_semester(semester_id: int, current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    result = db.query(Result).filter(Result.student_id == student.id, Result.semester_id == semester_id).first()
    if result is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


@router.get("/results/{result_id}/download")
def download_result(result_id: int, current_user=Depends(get_current_active_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    result = db.get(Result, result_id)
    if student is None or result is None or result.student_id != student.id:
        raise HTTPException(status_code=404, detail="Result not found")
    pdf_key = result.pdf_s3_url.split(f"s3://")[-1].split("/", 1)[-1]
    return {"download_url": generate_presigned_download_url(pdf_key)}
