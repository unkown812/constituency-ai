from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, Field


class ProjectRecommendation(BaseModel):
    id: UUID
    title: str
    description: str | None
    category: str
    status: str
    priority_score: float | None
    priority_label: str | None
    reasoning: str | None
    estimated_cost: float | None
    ward: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectStatusUpdate(BaseModel):
    status: str
    comment: str | None = None


class PaginatedProjects(BaseModel):
    items: list[ProjectRecommendation]
    total: int
    page: int
    limit: int
    total_pages: int
