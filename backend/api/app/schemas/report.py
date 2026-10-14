from pydantic import BaseModel, Field


class ReportTriggerResponse(BaseModel):
    job_id: str
    status: str = "queued"


class ReportStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float | None = None
    download_url: str | None = None
