from pydantic import BaseModel, Field


class DashboardOverview(BaseModel):
    total_complaints: int
    trends: dict | None = None
    top_categories: list[dict] = Field(default_factory=list)
    recent_submissions: list[dict] = Field(default_factory=list)


class MapPoint(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: dict
