from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ComplaintLocation(BaseModel):
    latitude: float
    longitude: float
    name: str | None


class TimelineEvent(BaseModel):
    event: str
    label: str
    date: datetime
    icon: str


class ComplaintCreate(BaseModel):
    category: str = Field(default="other")
    description: str = Field(..., min_length=10)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    address: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    document_url: str | None = None
    voice_url: str | None = None


class ComplaintResponse(BaseModel):
    id: UUID
    title: str | None
    description: str
    original_description: str | None = None
    original_language: str | None = None
    category: str
    status: str
    location: ComplaintLocation | None
    address: str | None
    ward: str | None
    constituency_id: UUID | None
    image_urls: list[str]
    document_url: str | None
    voice_url: str | None
    voice_transcript: str | None
    ai_summary: str | None
    ai_confidence: float | None
    urgency_score: float | None
    feedback_rating: str | None
    feedback_comment: str | None
    created_at: datetime
    updated_at: datetime
    timeline: list[TimelineEvent] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ComplaintListItem(BaseModel):
    id: UUID
    title: str | None
    category: str
    status: str
    location: ComplaintLocation | None
    thumbnail_url: str | None = None
    image_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaginatedComplaints(BaseModel):
    items: list[ComplaintListItem]
    total: int
    page: int
    limit: int
    total_pages: int


class ComplaintStats(BaseModel):
    total: int
    this_month: int
    by_status: dict[str, int]
    resolved_this_month: int
    under_review: int


class FeedbackRequest(BaseModel):
    rating: str | None = None
    comment: str | None = None
