import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_mp_or_admin
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.session import get_db
from app.models.user import User
from app.schemas.project import (
    PaginatedProjects,
    ProjectRecommendation,
    ProjectStatusUpdate,
)
from app.services.project_service import ProjectService
from app.tasks.project_tasks import generate_projects as generate_projects_task

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=PaginatedProjects)
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    status: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedProjects:
    service = ProjectService(db)
    return await service.list(
        user=current_user,
        category=category,
        status=status,
        page=page,
        limit=limit,
    )


@router.get("/{project_id}", response_model=ProjectRecommendation)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectRecommendation:
    service = ProjectService(db)
    project = await service.get_by_id(project_id)
    if not project:
        raise NotFoundError("Project not found")
    return ProjectRecommendation.model_validate(project)


@router.put("/{project_id}/status", response_model=ProjectRecommendation)
async def update_project_status(
    project_id: uuid.UUID,
    data: ProjectStatusUpdate,
    current_user: User = Depends(require_mp_or_admin),
    db: AsyncSession = Depends(get_db),
) -> ProjectRecommendation:
    service = ProjectService(db)
    project = await service.get_by_id(project_id)
    if not project:
        raise NotFoundError("Project not found")
    updated = await service.update_status(project_id, data)
    return ProjectRecommendation.model_validate(updated)


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_project_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if current_user.role != "admin":
        raise ForbiddenError("Requires admin role")
    task = generate_projects_task.delay()
    return {"detail": "Project generation started", "task_id": task.id}
