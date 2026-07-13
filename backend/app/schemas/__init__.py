from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenPair,
)
from app.schemas.course import CourseCreate, CourseRead, CourseUpdate
from app.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.schemas.examination import ExaminationCreate, ExaminationRead, ExaminationUpdate
from app.schemas.mark import MarkCreate, MarkRead, MarkUpdate
from app.schemas.notification import NotificationCreate, NotificationRead, NotificationUpdate
from app.schemas.result import ResultRead
from app.schemas.semester import SemesterCreate, SemesterRead, SemesterUpdate
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate
from app.schemas.user import (
    BulkCreateResponse,
    StudentAccountCreateResponse,
    StudentAccountRead,
    StudentCreate,
    StudentMarkRead,
    StudentRead,
    StudentUpdate,
    UserRead,
)

__all__ = [
    "ChangePasswordRequest",
    "ForgotPasswordRequest",
    "LoginRequest",
    "RefreshRequest",
    "ResetPasswordRequest",
    "TokenPair",
    "CourseCreate",
    "CourseRead",
    "CourseUpdate",
    "DepartmentCreate",
    "DepartmentRead",
    "DepartmentUpdate",
    "ExaminationCreate",
    "ExaminationRead",
    "ExaminationUpdate",
    "MarkCreate",
    "MarkRead",
    "MarkUpdate",
    "NotificationCreate",
    "NotificationRead",
    "NotificationUpdate",
    "ResultRead",
    "SemesterCreate",
    "SemesterRead",
    "SemesterUpdate",
    "SubjectCreate",
    "SubjectRead",
    "SubjectUpdate",
    "BulkCreateResponse",
    "StudentAccountCreateResponse",
    "StudentAccountRead",
    "StudentCreate",
    "StudentMarkRead",
    "StudentRead",
    "StudentUpdate",
    "UserRead",
]
