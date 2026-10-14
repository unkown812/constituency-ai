from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.user import User
from app.schemas.report import ReportStatusResponse, ReportTriggerResponse
from app.services.report_service import ReportService
from app.tasks.report_tasks import generate_report as generate_report_task

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate", response_model=ReportTriggerResponse, status_code=status.HTTP_202_ACCEPTED)
async def trigger_report_generation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportTriggerResponse:
    service = ReportService(db)
    job = await service.create_job(current_user.id)
    generate_report_task.delay(job_id=job.job_id)
    return job


@router.get("/status/{job_id}", response_model=ReportStatusResponse)
async def get_report_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReportStatusResponse:
    service = ReportService(db)
    status = await service.get_job_status(job_id)
    if not status:
        raise NotFoundError("Report job not found")
    return status


@router.get("/download/{job_id}")
async def download_report(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = ReportService(db)
    download_url = await service.get_download_url(job_id)
    if not download_url:
        raise NotFoundError("Report not ready or not found")
    return {"download_url": download_url}
