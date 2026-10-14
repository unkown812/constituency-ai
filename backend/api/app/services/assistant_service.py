import uuid
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.complaint import Complaint
from app.models.user import User
from app.schemas.assistant import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)


class AssistantService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def chat(self, current_user: User, data: ChatRequest) -> ChatResponse:
        constituency_id = current_user.constituency_id
        context = ""

        if constituency_id:
            result = await self.db.execute(
                select(Complaint)
                .where(
                    Complaint.constituency_id == constituency_id,
                    Complaint.is_deleted == False,
                )
                .order_by(Complaint.created_at.desc())
                .limit(20)
            )
            recent = list(result.scalars().all())
            if recent:
                lines = []
                for c in recent:
                    lines.append(
                        f"- [{c.status}] {c.title or 'Untitled'} ({c.category}): "
                        f"{c.description[:200] if c.description else 'No description'}"
                    )
                context = "Recent complaints in your constituency:\n" + "\n".join(lines)

        answer = await self._query_llm(data.question, context)
        sources = await self._get_sources(data.question, constituency_id)

        return ChatResponse(answer=answer, sources=sources)

    async def _query_llm(self, question: str, context: str) -> str:
        prompt = (
            "You are an AI assistant helping a Member of Parliament analyze constituency issues. "
            "Answer based on the context provided.\n\n"
        )
        if context:
            prompt += f"Context:\n{context}\n\n"
        prompt += f"Question: {question}\n\nAnswer:"

        try:
            import httpx
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{settings.llm_service_url}/chat",
                    json={"prompt": prompt, "max_tokens": 500},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("response", "")
        except Exception as e:
            logger.warning(f"LLM chat failed, using fallback: {e}")

        return self._fallback_answer(question, context)

    def _fallback_answer(self, question: str, context: str) -> str:
        q = question.lower()
        if "complaint" in q or "issue" in q or "problem" in q:
            if context:
                lines = context.split("\n")
                return (
                    f"Based on recent data, there are {len(lines) - 1} recent complaints "
                    f"in your constituency. Review them in the dashboard for details."
                )
        if "summary" in q or "overview" in q:
            return (
                "I can help you review constituency data. "
                "Visit the Dashboard or Analytics section for a visual overview."
            )
        return (
            "I'm analyzing your question. For detailed constituency insights, "
            "please check the Dashboard or Analytics pages."
        )

    async def _get_sources(
        self, question: str, constituency_id: uuid.UUID | None
    ) -> list[dict]:
        sources = []
        if not constituency_id:
            return sources

        try:
            from app.utils.qdrant_client import get_qdrant

            client = get_qdrant()
            search_result = client.scroll(
                collection_name=settings.qdrant_collection,
                limit=3,
                with_payload=True,
            )
            for point in search_result[0]:
                payload = point.payload or {}
                sources.append({
                    "id": payload.get("complaint_id", ""),
                    "category": payload.get("category", ""),
                    "score": point.score if hasattr(point, "score") else None,
                })
        except Exception as e:
            logger.warning(f"Failed to fetch sources from Qdrant: {e}")

        return sources
