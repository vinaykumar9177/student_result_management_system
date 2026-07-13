from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: int
    message: str
    type: str


class NotificationRead(NotificationCreate):
    id: int
    sent_at: datetime
    read_status: bool

    model_config = {"from_attributes": True}


class NotificationUpdate(BaseModel):
    read_status: bool | None = None
