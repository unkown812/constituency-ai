from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_mp_or_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardOverview, MapPoint
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    current_user: User = Depends(require_mp_or_admin),
    db: AsyncSession = Depends(get_db),
) -> DashboardOverview:
    service = DashboardService(db)
    return await service.get_overview(current_user)


@router.get("/map", response_model=list[MapPoint])
async def get_dashboard_map(
    current_user: User = Depends(require_mp_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[MapPoint]:
    service = DashboardService(db)
    return await service.get_map(current_user)
