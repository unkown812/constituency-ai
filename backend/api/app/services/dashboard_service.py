import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.user import User
from app.schemas.dashboard import DashboardOverview, MapPoint
from app.utils.geo_utils import extract_coordinates


class DashboardService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_overview(self, current_user: User) -> DashboardOverview:
        constituency_id = current_user.constituency_id
        if not constituency_id:
            return DashboardOverview(total_complaints=0)

        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        base_conditions = [
            Complaint.constituency_id == constituency_id,
            Complaint.is_deleted == False,
        ]

        total_complaints = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(and_(*base_conditions))
            )
        ).scalar_one()

        recent_total = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    and_(*base_conditions, Complaint.created_at >= thirty_days_ago)
                )
            )
        ).scalar_one()

        previous_start = thirty_days_ago - timedelta(days=30)
        previous_total = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    and_(
                        *base_conditions,
                        Complaint.created_at >= previous_start,
                        Complaint.created_at < thirty_days_ago,
                    )
                )
            )
        ).scalar_one()

        trends = None
        if previous_total > 0:
            change = ((recent_total - previous_total) / previous_total) * 100
            trends = {
                "direction": "up" if change > 0 else "down",
                "percentage": round(abs(change), 1),
                "comparison_period": "last_30_days_vs_previous_30",
            }

        category_rows = await self.db.execute(
            select(Complaint.category, func.count(Complaint.id))
            .where(and_(*base_conditions))
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
        )
        top_categories = [
            {"category": row[0], "count": row[1]}
            for row in category_rows
        ][:5]

        recent_rows = await self.db.execute(
            select(
                Complaint.id, Complaint.title, Complaint.category,
                Complaint.status, Complaint.created_at
            )
            .where(and_(*base_conditions))
            .order_by(Complaint.created_at.desc())
            .limit(10)
        )
        recent_submissions = [
            {
                "id": str(row[0]),
                "title": row[1] or "",
                "category": row[2],
                "status": row[3],
                "created_at": row[4].isoformat() if row[4] else None,
            }
            for row in recent_rows
        ]

        return DashboardOverview(
            total_complaints=total_complaints,
            trends=trends,
            top_categories=top_categories,
            recent_submissions=recent_submissions,
        )

    async def get_map(self, current_user: User) -> list[MapPoint]:
        constituency_id = current_user.constituency_id
        if not constituency_id:
            return []

        result = await self.db.execute(
            select(Complaint).where(
                and_(
                    Complaint.constituency_id == constituency_id,
                    Complaint.is_deleted == False,
                    Complaint.location.is_not(None),
                )
            )
        )
        complaints = list(result.scalars().all())

        features = []
        for c in complaints:
            coords = extract_coordinates(c.location)
            if coords is None:
                continue
            features.append(MapPoint(
                geometry={
                    "type": "Point",
                    "coordinates": [coords[1], coords[0]],
                },
                properties={
                    "id": str(c.id),
                    "title": c.title or "",
                    "category": c.category,
                    "status": c.status,
                    "address": c.address or "",
                    "ward": c.ward or "",
                    "urgency_score": c.urgency_score,
                },
            ))

        return features
