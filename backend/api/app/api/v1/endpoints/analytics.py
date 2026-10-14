from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_mp_or_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.analytics import CorrelationResponse, InsightsResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(
    current_user: User = Depends(require_mp_or_admin),
    db: AsyncSession = Depends(get_db),
) -> InsightsResponse:
    service = AnalyticsService(db)
    return await service.get_insights(current_user)


@router.get("/correlation", response_model=CorrelationResponse)
async def get_correlation(
    current_user: User = Depends(require_mp_or_admin),
    db: AsyncSession = Depends(get_db),
) -> CorrelationResponse:
    service = AnalyticsService(db)
    return await service.get_correlation(current_user)
