import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, queue="ai_pipeline")
def generate_recommendations(self, constituency_id: str):
    """Generate project recommendations for a constituency."""
    logger.info(f"Generating recommendations for constituency {constituency_id}")
    return {"status": "completed", "constituency_id": constituency_id}
