from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "constituency_ai",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_queues={
        "ai_pipeline": {"exchange": "default", "routing_key": "ai_pipeline"},
        "notifications": {"exchange": "default", "routing_key": "notifications"},
        "scheduled": {"exchange": "default", "routing_key": "scheduled"},
        "maintenance": {"exchange": "default", "routing_key": "maintenance"},
    },
    task_routes={
        "app.tasks.ai_tasks.*": {"queue": "ai_pipeline"},
        "app.tasks.notification_tasks.*": {"queue": "notifications"},
        "app.tasks.report_tasks.*": {"queue": "ai_pipeline"},
        "app.tasks.project_tasks.*": {"queue": "ai_pipeline"},
    },
)
