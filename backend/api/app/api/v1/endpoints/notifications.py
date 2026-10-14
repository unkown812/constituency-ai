import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationPreferencesUpdate,
    PaginatedNotifications,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=PaginatedNotifications)
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedNotifications:
    service = NotificationService(db)
    return await service.list_notifications(current_user.id, page=page, limit=limit)


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    notification = await service.get_by_id(notification_id)
    if not notification or notification.user_id != current_user.id:
        raise NotFoundError("Notification not found")
    await service.mark_read(notification_id)
    return {"detail": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    await service.mark_all_read(current_user.id)
    return {"detail": "All notifications marked as read"}


@router.put("/preferences")
async def update_notification_preferences(
    data: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = NotificationService(db)
    await service.update_preferences(current_user.id, data)
    return {"detail": "Preferences updated successfully"}
