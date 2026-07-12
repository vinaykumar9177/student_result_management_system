from fastapi import APIRouter

from app.api.routes import admin, auth, faculty, student

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["faculty"])
api_router.include_router(student.router, prefix="/student", tags=["student"])
