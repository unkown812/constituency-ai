import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.schemas.report import ReportStatusResponse, ReportTriggerResponse


class ReportJob:
    """In-memory report job storage. In production, use a DB table."""
    _jobs: dict[str, dict] = {}


class ReportService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_job(self, user_id: uuid.UUID) -> ReportTriggerResponse:
        job_id = str(uuid.uuid4())
        ReportJob._jobs[job_id] = {
            "job_id": job_id,
            "user_id": str(user_id),
            "status": "queued",
            "progress": 0.0,
            "download_url": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        return ReportTriggerResponse(job_id=job_id, status="queued")

    async def get_job_status(self, job_id: str) -> ReportStatusResponse | None:
        job = ReportJob._jobs.get(job_id)
        if not job:
            return None
        return ReportStatusResponse(
            job_id=job["job_id"],
            status=job["status"],
            progress=job.get("progress"),
            download_url=job.get("download_url"),
        )

    async def get_download_url(self, job_id: str) -> str | None:
        job = ReportJob._jobs.get(job_id)
        if not job:
            return None
        return job.get("download_url")
