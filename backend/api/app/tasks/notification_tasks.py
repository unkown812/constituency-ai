import asyncio
import logging
import uuid

from celery import Task
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.db.session import async_session_factory
from app.models.notification import Notification

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, queue="notifications")
def send_notification(self, user_id: str, type: str, title: str, body: str, submission_id: str | None = None):
    """Create and persist a notification for a user."""
    asyncio.run(_send_notification_async(user_id, type, title, body, submission_id))


async def _send_notification_async(user_id: str, type: str, title: str, body: str, submission_id: str | None):
    async with async_session_factory() as db:
        try:
            notification = Notification(
                user_id=uuid.UUID(user_id),
                type=type,
                title=title,
                body=body,
                submission_id=uuid.UUID(submission_id) if submission_id else None,
                is_read=False,
            )
            db.add(notification)
            await db.commit()
            logger.info(f"Notification created for user {user_id}: {title}")
        except Exception as e:
            logger.exception(f"Failed to create notification: {e}")


@celery_app.task(bind=True, queue="scheduled")
def generate_weekly_digest(self):
    """Scheduled task to generate weekly digest for all MPs."""
    logger.info("Weekly digest generation started")


@celery_app.task(bind=True, queue="maintenance")
def cleanup_expired_tokens(self):
    """Scheduled task to clean up expired data."""
    logger.info("Cleanup task started")
