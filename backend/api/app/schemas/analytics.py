from pydantic import BaseModel, Field


class InsightsResponse(BaseModel):
    insights: list[dict] = Field(default_factory=list)


class CorrelationResponse(BaseModel):
    data: list[dict] = Field(default_factory=list)
