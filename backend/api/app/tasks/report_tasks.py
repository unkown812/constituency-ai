import logging
import uuid

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, queue="ai_pipeline")
def generate_report(self, job_id: str):
    """Generate a report (PDF/CSV)."""
    logger.info(f"Generating report for job {job_id}")
    from app.services.report_service import ReportJob

    if job_id in ReportJob._jobs:
        ReportJob._jobs[job_id]["status"] = "processing"
        ReportJob._jobs[job_id]["progress"] = 0.5

    try:
        import asyncio
        asyncio.run(_generate_report_async(job_id))
    except Exception as e:
        logger.exception(f"Report generation failed for job {job_id}: {e}")
        if job_id in ReportJob._jobs:
            ReportJob._jobs[job_id]["status"] = "failed"
            ReportJob._jobs[job_id]["progress"] = None

    return {"job_id": job_id, "status": "completed", "download_url": None}


async def _generate_report_async(job_id: str):
    """Async report generation logic."""
    from app.db.session import async_session_factory
    from app.models.complaint import Complaint
    from app.models.user import User
    from sqlalchemy import select, func

    async with async_session_factory() as db:
        from app.services.report_service import ReportJob
        job = ReportJob._jobs.get(job_id)
        if not job:
            return

        user_id = job.get("user_id")
        if not user_id:
            return

        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.constituency_id:
            ReportJob._jobs[job_id]["status"] = "completed"
            ReportJob._jobs[job_id]["progress"] = 1.0
            return

        total = (
            await db.execute(
                select(func.count(Complaint.id)).where(
                    Complaint.constituency_id == user.constituency_id,
                    Complaint.is_deleted == False,
                )
            )
        ).scalar_one()

        ReportJob._jobs[job_id]["status"] = "completed"
        ReportJob._jobs[job_id]["progress"] = 1.0
        ReportJob._jobs[job_id]["download_url"] = None
        logger.info(f"Report for constituency {user.constituency_id}: {total} complaints found")
