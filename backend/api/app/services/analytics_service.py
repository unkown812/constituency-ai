import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.constituency import Constituency
from app.models.project import Project
from app.models.ward import Ward


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_insights(self, constituency_id: uuid.UUID) -> dict:
        total_complaints = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    Complaint.constituency_id == constituency_id,
                    Complaint.is_deleted == False,
                )
            )
        ).scalar_one()

        category_counts = await self.db.execute(
            select(Complaint.category, func.count(Complaint.id))
            .where(
                Complaint.constituency_id == constituency_id,
                Complaint.is_deleted == False,
            )
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
        )
        top_categories = [
            {"category": row[0], "count": row[1]} for row in category_counts
        ]

        ward_counts = await self.db.execute(
            select(Complaint.ward, func.count(Complaint.id))
            .where(
                Complaint.constituency_id == constituency_id,
                Complaint.is_deleted == False,
                Complaint.ward.is_not(None),
            )
            .group_by(Complaint.ward)
            .order_by(func.count(Complaint.id).desc())
        )
        ward_breakdown = [
            {"ward": row[0], "count": row[1]} for row in ward_counts
        ]

        ward_pop = await self.db.execute(
            select(Ward.name, Ward.population).where(
                Ward.constituency_id == constituency_id
            )
        )
        population_data = {row[0]: row[1] for row in ward_pop}

        gap_analysis = []
        for w in ward_breakdown:
            pop = population_data.get(w["ward"])
            gap_analysis.append(
                {
                    "ward": w["ward"],
                    "complaint_count": w["count"],
                    "population": pop,
                    "complaints_per_capita": (
                        round(w["count"] / pop, 4) if pop and pop > 0 else None
                    ),
                }
            )

        resolved_count = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    Complaint.constituency_id == constituency_id,
                    Complaint.is_deleted == False,
                    Complaint.status == "resolved",
                )
            )
        ).scalar_one()

        return {
            "total_complaints": total_complaints,
            "resolved_complaints": resolved_count,
            "resolution_rate": (
                round(resolved_count / total_complaints * 100, 2)
                if total_complaints > 0
                else 0
            ),
            "top_categories": top_categories,
            "ward_breakdown": ward_breakdown,
            "gap_analysis": gap_analysis,
        }

    async def get_correlation(self, constituency_id: uuid.UUID) -> list[dict]:
        category_counts = await self.db.execute(
            select(Complaint.category, func.count(Complaint.id))
            .where(
                Complaint.constituency_id == constituency_id,
                Complaint.is_deleted == False,
            )
            .group_by(Complaint.category)
        )
        complaint_volumes = {row[0]: row[1] for row in category_counts}

        project_counts = await self.db.execute(
            select(Project.category, func.count(Project.id)).where(
                Project.constituency_id == constituency_id,
                Project.status.in_(["active", "completed"]),
            )
            .group_by(Project.category)
        )
        project_infrastructure = {row[0]: row[1] for row in project_counts}

        all_categories = set(complaint_volumes.keys()) | set(
            project_infrastructure.keys()
        )
        correlation_data = []
        for cat in sorted(all_categories):
            volume = complaint_volumes.get(cat, 0)
            infra = project_infrastructure.get(cat, 0)
            correlation_data.append(
                {
                    "category": cat,
                    "complaint_volume": volume,
                    "infrastructure_projects": infra,
                    "deficit_score": round(volume / (infra + 1), 2),
                }
            )

        return correlation_data

    async def get_dashboard_overview(
        self, constituency_id: uuid.UUID
    ) -> dict:
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

        previous_period_start = thirty_days_ago - timedelta(days=30)
        previous_total = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(
                    and_(
                        *base_conditions,
                        Complaint.created_at >= previous_period_start,
                        Complaint.created_at < thirty_days_ago,
                    )
                )
            )
        ).scalar_one()

        trend = None
        if previous_total > 0:
            change = ((recent_total - previous_total) / previous_total) * 100
            trend = {
                "direction": "up" if change > 0 else "down",
                "percentage": round(abs(change), 1),
                "comparison_period": "last_30_days_vs_previous_30",
            }

        category_counts = await self.db.execute(
            select(Complaint.category, func.count(Complaint.id))
            .where(and_(*base_conditions))
            .group_by(Complaint.category)
            .order_by(func.count(Complaint.id).desc())
        )
        top_categories = [
            {"category": row[0], "count": row[1]}
            for row in category_counts
        ][:5]

        recent_result = await self.db.execute(
            select(Complaint.id, Complaint.title, Complaint.category, Complaint.status, Complaint.created_at)
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
            for row in recent_result
        ]

        status_counts = await self.db.execute(
            select(Complaint.status, func.count(Complaint.id))
            .where(and_(*base_conditions))
            .group_by(Complaint.status)
        )
        status_breakdown = {row[0]: row[1] for row in status_counts}

        return {
            "total_complaints": total_complaints,
            "trends": trend,
            "top_categories": top_categories,
            "recent_submissions": recent_submissions,
            "status_breakdown": status_breakdown,
        }
