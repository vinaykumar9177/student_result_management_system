from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.core.dependencies import require_role
from app.models.user import UserRole


def test_require_role_allows_matching_role():
    dependency = require_role(UserRole.admin)
    user = SimpleNamespace(role=UserRole.admin)
    assert dependency(current_user=user) is user


def test_require_role_blocks_non_matching_role():
    dependency = require_role(UserRole.admin)
    user = SimpleNamespace(role=UserRole.student)
    with pytest.raises(HTTPException):
        dependency(current_user=user)
