import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus
from app.schemas.complaint import ComplaintCreate
from app.utils.geo_utils import create_point


class ComplaintService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, data: ComplaintCreate, user_id: uuid.UUID) -> Complaint:
        location = None
        if data.latitude is not None and data.longitude is not None:
            location = create_point(data.latitude, data.longitude)

        complaint = Complaint(
            user_id=user_id,
            description=data.description,
            category=data.category,
            location=location,
            address=data.address,
            image_urls=data.image_urls or [],
            document_url=data.document_url,
            voice_url=data.voice_url,
        )
        self.db.add(complaint)
        await self.db.commit()
        await self.db.refresh(complaint)

        try:
            from app.tasks.ai_tasks import process_complaint

            process_complaint.delay(str(complaint.id))
        except (ImportError, Exception):
            pass

        return complaint

    async def get_by_id(self, complaint_id: uuid.UUID) -> Complaint | None:
        result = await self.db.execute(
            select(Complaint).where(
                Complaint.id == complaint_id, Complaint.is_deleted == False
            )
        )
        return result.scalar_one_or_none()

    async def list_by_user(
        self,
        user_id: uuid.UUID,
        status: str | None = None,
        page: int = 1,
        limit: int = 20,
        sort: str = "recent",
    ) -> tuple[list[Complaint], int]:
        conditions = [Complaint.user_id == user_id, Complaint.is_deleted == False]
        if status:
            conditions.append(Complaint.status == status)

        total_result = await self.db.execute(
            select(func.count(Complaint.id)).where(and_(*conditions))
        )
        total = total_result.scalar_one()

        query = select(Complaint).where(and_(*conditions))
        if sort == "oldest":
            query = query.order_by(Complaint.created_at.asc())
        else:
            query = query.order_by(Complaint.created_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def list_by_constituency(
        self,
        constituency_id: uuid.UUID,
        status: str | None = None,
        category: str | None = None,
        page: int = 1,
        limit: int = 20,
        sort: str = "recent",
    ) -> tuple[list[Complaint], int]:
        conditions = [
            Complaint.constituency_id == constituency_id,
            Complaint.is_deleted == False,
        ]
        if status:
            conditions.append(Complaint.status == status)
        if category:
            conditions.append(Complaint.category == category)

        total_result = await self.db.execute(
            select(func.count(Complaint.id)).where(and_(*conditions))
        )
        total = total_result.scalar_one()

        query = select(Complaint).where(and_(*conditions))
        if sort == "oldest":
            query = query.order_by(Complaint.created_at.asc())
        else:
            query = query.order_by(Complaint.created_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def list(
        self,
        user_id: uuid.UUID | None = None,
        constituency_id: uuid.UUID | None = None,
        status: str | None = None,
        category: str | None = None,
        ward: str | None = None,
        page: int = 1,
        limit: int = 20,
        sort: str = "recent",
    ) -> dict:
        if user_id:
            items, total = await self.list_by_user(
                user_id, status=status, page=page, limit=limit, sort=sort
            )
        elif constituency_id:
            items, total = await self.list_by_constituency(
                constituency_id, status=status, category=category,
                page=page, limit=limit, sort=sort
            )
        else:
            conditions = [Complaint.is_deleted == False]
            if status:
                conditions.append(Complaint.status == status)
            if category:
                conditions.append(Complaint.category == category)

            total_result = await self.db.execute(
                select(func.count(Complaint.id)).where(and_(*conditions))
            )
            total = total_result.scalar_one()

            query = select(Complaint).where(and_(*conditions)).order_by(Complaint.created_at.desc())
            offset = (page - 1) * limit
            query = query.offset(offset).limit(limit)
            result = await self.db.execute(query)
            items = list(result.scalars().all())

        total_pages = max(1, (total + limit - 1) // limit)
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }

    async def get_stats(self, user_id: uuid.UUID) -> dict:
        now = datetime.now(timezone.utc)
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        base = [Complaint.user_id == user_id, Complaint.is_deleted == False]

        total = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(and_(*base))
            )
        ).scalar_one()

        this_month = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    and_(*base, Complaint.created_at >= first_of_month)
                )
            )
        ).scalar_one()

        resolved_this_month = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    and_(
                        *base,
                        Complaint.status == "resolved",
                        Complaint.created_at >= first_of_month,
                    )
                )
            )
        ).scalar_one()

        under_review = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    and_(*base, Complaint.status == "under_review")
                )
            )
        ).scalar_one()

        status_rows = await self.db.execute(
            select(Complaint.status, func.count(Complaint.id))
            .where(and_(*base))
            .group_by(Complaint.status)
        )
        by_status = {row[0]: row[1] for row in status_rows}

        return {
            "total": total,
            "this_month": this_month,
            "by_status": by_status,
            "resolved_this_month": resolved_this_month,
            "under_review": under_review,
        }

    async def update_feedback(
        self,
        complaint_id: uuid.UUID,
        rating: str | None,
        comment: str | None,
    ) -> Complaint:
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            raise NotFoundError("Complaint not found")
        complaint.feedback_rating = rating
        complaint.feedback_comment = comment
        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint

    async def mark_duplicate(
        self, complaint_id: uuid.UUID, duplicate_of_id: uuid.UUID
    ) -> Complaint:
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            raise NotFoundError("Complaint not found")
        complaint.duplicate_of_id = duplicate_of_id
        complaint.status = ComplaintStatus.closed.value
        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint

    async def update_ai_results(
        self, complaint_id: uuid.UUID, data: dict
    ) -> Complaint:
        complaint = await self.get_by_id(complaint_id)
        if not complaint:
            raise NotFoundError("Complaint not found")

        field_map = {
            "ai_summary": "ai_summary",
            "ai_confidence": "ai_confidence",
            "urgency_score": "urgency_score",
            "category": "category",
            "status": "status",
            "description_en": "description_en",
            "original_language": "original_language",
            "ward": "ward",
            "pipeline_version": "pipeline_version",
            "pipeline_completed_at": "pipeline_completed_at",
            "ai_services_used": "ai_services_used",
            "voice_transcript": "voice_transcript",
            "title": "title",
        }
        for key, attr in field_map.items():
            if key in data:
                setattr(complaint, attr, data[key])

        await self.db.commit()
        await self.db.refresh(complaint)
        return complaint
