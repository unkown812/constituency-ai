from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    id: UUID
    full_name: str | None
    phone: str
    email: str | None
    avatar_url: str | None
    constituency_id: UUID | None
    constituency_name: str | None
    preferred_language: str
    notification_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    preferred_language: str | None = None
    notification_enabled: bool | None = None


class AvatarResponse(BaseModel):
    avatar_url: str
