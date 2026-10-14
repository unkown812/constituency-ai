from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class NotificationItem(BaseModel):
    id: UUID
    type: str
    title: str
    body: str
    submission_id: UUID | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedNotifications(BaseModel):
    items: list[NotificationItem]
    unread_count: int
    total: int
    page: int
    limit: int


class NotificationPreferencesUpdate(BaseModel):
    push_enabled: bool | None = None
    status_changes: bool | None = None
    ai_analysis_complete: bool | None = None
    weekly_digest: bool | None = None
