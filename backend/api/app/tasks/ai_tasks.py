import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from celery import Task
from geoalchemy2.shape import to_shape
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.config import settings
from app.db.session import async_session_factory
from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus
from app.utils.geo_utils import create_point
from app.utils.qdrant_client import get_qdrant

logger = logging.getLogger(__name__)


class DatabaseTask(Task):
    _db: AsyncSession | None = None

    @property
    def db(self) -> AsyncSession:
        return self._db


async def get_complaint(db: AsyncSession, complaint_id: str) -> Complaint | None:
    result = await db.execute(select(Complaint).where(Complaint.id == uuid.UUID(complaint_id)))
    return result.scalar_one_or_none()


async def update_complaint_status(db: AsyncSession, complaint_id: str, status: str):
    await db.execute(
        update(Complaint).where(Complaint.id == uuid.UUID(complaint_id)).values(status=status)
    )
    await db.commit()


async def update_complaint_fields(db: AsyncSession, complaint_id: str, **kwargs):
    await db.execute(
        update(Complaint).where(Complaint.id == uuid.UUID(complaint_id)).values(**kwargs)
    )
    await db.commit()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30, queue="ai_pipeline", acks_late=True)
def process_complaint(self, complaint_id: str):
    """Main AI pipeline orchestrator."""
    asyncio.run(_process_complaint_async(complaint_id))


async def _process_complaint_async(complaint_id: str):
    async with async_session_factory() as db:
        try:
            complaint = await get_complaint(db, complaint_id)
            if not complaint:
                logger.error(f"Complaint {complaint_id} not found")
                return

            await update_complaint_status(db, complaint_id, "ai_processing")
            services_used: list[str] = []
            llm_result = None

            # Step 1: Voice transcription
            if complaint.voice_url:
                try:
                    transcript = await call_ai_service(
                        f"{settings.speech_service_url}/transcribe",
                        method="POST",
                        files={"file": ("audio", fetch_file(complaint.voice_url))},
                    )
                    if transcript and transcript.get("transcript"):
                        await update_complaint_fields(
                            db, complaint_id,
                            voice_transcript=transcript["transcript"],
                            description=complaint.description + "\n" + transcript["transcript"],
                        )
                        services_used.append("speech")
                except Exception as e:
                    logger.error(f"Speech failed for {complaint_id}: {e}")

            # Step 2: OCR for documents
            if complaint.document_url:
                try:
                    ocr_result = await call_ai_service(
                        f"{settings.ocr_service_url}/extract",
                        method="POST",
                        files={"file": ("doc", fetch_file(complaint.document_url))},
                    )
                    if ocr_result and ocr_result.get("extracted_text"):
                        current = complaint.description
                        await update_complaint_fields(
                            db, complaint_id,
                            description=current + "\n" + ocr_result["extracted_text"],
                        )
                        services_used.append("ocr")
                except Exception as e:
                    logger.error(f"OCR failed for {complaint_id}: {e}")

            # Re-fetch complaint after modifications
            complaint = await get_complaint(db, complaint_id)
            text_to_translate = complaint.description if complaint else ""

            # Step 3: Translation (if not English)
            if text_to_translate and not is_english(text_to_translate):
                try:
                    translation = await call_ai_service(
                        f"{settings.translation_service_url}/translate",
                        method="POST",
                        json={"text": text_to_translate, "source_language": None, "target_language": "en"},
                    )
                    if translation and translation.get("translated_text"):
                        await update_complaint_fields(
                            db, complaint_id,
                            description_en=translation["translated_text"],
                            original_language=translation.get("detected_source_language", "unknown"),
                        )
                        services_used.append("translation")
                except Exception as e:
                    logger.error(f"Translation failed for {complaint_id}: {e}")
            else:
                await update_complaint_fields(
                    db, complaint_id,
                    description_en=text_to_translate,
                    original_language="en",
                )

            # Re-fetch for English text
            complaint = await get_complaint(db, complaint_id)
            text_for_llm = complaint.description_en if complaint and complaint.description_en else (complaint.description if complaint else "")

            # Step 4: LLM Classification
            if text_for_llm:
                try:
                    llm_result = await call_ai_service(
                        f"{settings.llm_service_url}/classify",
                        method="POST",
                        json={"text": text_for_llm, "categories": [
                            "roads", "water", "health", "education",
                            "electricity", "sanitation", "public_transport", "other",
                        ]},
                    )
                    if llm_result:
                        await update_complaint_fields(
                            db, complaint_id,
                            category=llm_result.get("category", complaint.category),
                            title=llm_result.get("title"),
                            ai_summary=llm_result.get("summary"),
                            ai_confidence=llm_result.get("category_confidence"),
                            urgency_score=llm_result.get("urgency_score"),
                        )
                        services_used.append("llm")
                except Exception as e:
                    logger.error(f"LLM failed for {complaint_id}: {e}")

            # Step 5: Vision analysis
            if complaint and complaint.image_urls:
                vision_results: list[dict] = []
                category_hint = llm_result.get("category") if llm_result else None
                for url in complaint.image_urls:
                    try:
                        vision = await call_ai_service(
                            f"{settings.vision_service_url}/analyze",
                            method="POST",
                            files={"file": ("image", fetch_file(url))},
                            data={"category_hint": category_hint or ""},
                        )
                        if vision:
                            vision_results.append(vision)
                    except Exception as e:
                        logger.error(f"Vision failed for {url}: {e}")
                if vision_results:
                    services_used.append("vision")

            # Step 6: Generate embedding and store in Qdrant
            complaint = await get_complaint(db, complaint_id)
            embed_text = complaint.description_en or (complaint.description if complaint else "") or ""
            if embed_text:
                try:
                    embedding_result = await call_ai_service(
                        f"{settings.embeddings_service_url}/embed",
                        method="POST",
                        json={"texts": [embed_text]},
                    )
                    if embedding_result and embedding_result.get("embeddings"):
                        embedding = embedding_result["embeddings"][0]
                        try:
                            client = get_qdrant()
                            client.upsert(
                                collection_name=settings.qdrant_collection,
                                points=[{
                                    "id": complaint_id,
                                    "vector": embedding,
                                    "payload": {
                                        "complaint_id": str(complaint.id) if complaint else complaint_id,
                                        "category": complaint.category if complaint else "other",
                                        "constituency_id": str(complaint.constituency_id) if complaint and complaint.constituency_id else None,
                                    },
                                }],
                            )
                            services_used.append("embeddings")
                        except Exception as e:
                            logger.error(f"Qdrant upsert failed for {complaint_id}: {e}")
                except Exception as e:
                    logger.error(f"Embedding failed for {complaint_id}: {e}")

            # Step 7: Geotagging
            if complaint and complaint.location:
                try:
                    point = to_shape(complaint.location)
                    services_used.append("geotagging")
                except Exception as e:
                    logger.error(f"Geotagging failed for {complaint_id}: {e}")

            # Step 8: Mark analyzed
            await update_complaint_fields(
                db, complaint_id,
                status="analyzed",
                pipeline_completed_at=datetime.now(timezone.utc),
                ai_services_used=services_used,
                pipeline_version="1.0.0",
            )

            # Step 9: Create notification
            try:
                from app.tasks.notification_tasks import send_notification
                send_notification.delay(
                    user_id=str(complaint.user_id),
                    type="ai_analysis_complete",
                    title="Analysis Complete",
                    body="Your report has been analyzed.",
                    submission_id=complaint_id,
                )
            except Exception as e:
                logger.error(f"Notification failed for {complaint_id}: {e}")

        except Exception as e:
            logger.exception(f"Pipeline failed for complaint {complaint_id}: {e}")
            await update_complaint_status(db, complaint_id, "analyzed")


def is_english(text: str) -> bool:
    """Simple check if text is mostly English characters."""
    non_ascii = sum(1 for c in text if ord(c) > 127)
    return non_ascii / max(len(text), 1) < 0.3


async def call_ai_service(url: str, method: str = "POST", **kwargs: Any) -> dict | None:
    """Call an AI microservice via HTTP."""
    import httpx
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            if method == "POST":
                if "files" in kwargs:
                    resp = await client.post(url, files=kwargs.get("files"), data=kwargs.get("data"))
                elif "json" in kwargs:
                    resp = await client.post(url, json=kwargs.get("json"))
                else:
                    resp = await client.post(url)
            else:
                resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            logger.warning(f"AI service call failed: {url} - {e}")
            return None


def fetch_file(url: str) -> bytes:
    """Fetch a file from URL. For local files, read from disk. For remote, use httpx."""
    import httpx
    if url.startswith("/uploads/"):
        path = url.lstrip("/")
        with open(path, "rb") as f:
            return f.read()
    resp = httpx.get(url, timeout=30.0)
    resp.raise_for_status()
    return resp.content


@celery_app.task(bind=True, max_retries=3, queue="ai_pipeline")
def detect_duplicates(self, complaint_id: str):
    """Check for duplicates after embedding is stored."""
    asyncio.run(_detect_duplicates_async(complaint_id))


async def _detect_duplicates_async(complaint_id: str):
    async with async_session_factory() as db:
        client = get_qdrant()
        try:
            result = client.retrieve(
                collection_name=settings.qdrant_collection,
                ids=[complaint_id],
                with_vectors=True,
            )
            if not result:
                logger.info(f"Complaint {complaint_id} not found in Qdrant, skipping duplicate check")
                return

            vector = result[0].vector
            if vector is None:
                logger.info(f"No vector for complaint {complaint_id}, skipping duplicate check")
                return

            search_result = client.search(
                collection_name=settings.qdrant_collection,
                query_vector=vector,
                with_payload=True,
                limit=5,
            )

            for point in search_result:
                if point.id != complaint_id and point.score and point.score > 0.95:
                    payload = point.payload or {}
                    from app.services.complaint_service import ComplaintService
                    service = ComplaintService(db)
                    try:
                        await service.mark_duplicate(
                            complaint_id=uuid.UUID(complaint_id),
                            duplicate_of_id=uuid.UUID(payload.get("complaint_id", point.id)),
                        )
                        logger.info(f"Marked {complaint_id} as duplicate of {point.id}")
                    except Exception as mark_err:
                        logger.error(f"Failed to mark duplicate: {mark_err}")
                    break
        except Exception as e:
            logger.error(f"Duplicate detection failed for {complaint_id}: {e}")
