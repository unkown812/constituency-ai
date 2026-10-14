from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict] = Field(default_factory=list)
