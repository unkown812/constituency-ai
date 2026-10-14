import uuid

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.project import Project
from app.models.enums import ComplaintCategory


class ProjectService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_projects(
        self,
        constituency_id: uuid.UUID,
        category: str | None = None,
        status: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Project], int]:
        conditions = [Project.constituency_id == constituency_id]
        if category:
            conditions.append(Project.category == category)
        if status:
            conditions.append(Project.status == status)

        total_result = await self.db.execute(
            select(func.count(Project.id)).where(and_(*conditions))
        )
        total = total_result.scalar_one()

        query = (
            select(Project)
            .where(and_(*conditions))
            .order_by(Project.created_at.desc())
        )
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        result = await self.db.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def get_by_id(self, project_id: uuid.UUID) -> Project | None:
        result = await self.db.execute(
            select(Project).where(Project.id == project_id)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        project_id: uuid.UUID,
        status: str,
        comment: str | None = None,
        user_id: uuid.UUID | None = None,
    ) -> Project:
        project = await self.get_by_id(project_id)
        if not project:
            raise NotFoundError("Project not found")
        project.status = status
        if comment is not None:
            project.reasoning = comment
        if user_id is not None:
            project.created_by = user_id
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def generate_recommendations(
        self, constituency_id: uuid.UUID
    ) -> list[Project]:
        try:
            from app.tasks.recommendation_tasks import generate_recommendations

            generate_recommendations.delay(str(constituency_id))
        except (ImportError, Exception):
            pass

        result = await self.db.execute(
            select(Project)
            .where(
                Project.constituency_id == constituency_id,
                Project.status == "draft",
            )
            .order_by(Project.priority_score.desc().nulls_last())
        )
        return list(result.scalars().all())
