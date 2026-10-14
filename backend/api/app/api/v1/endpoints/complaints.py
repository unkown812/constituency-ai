import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.db.session import get_db
from app.models.user import User
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintStats,
    FeedbackRequest,
    PaginatedComplaints,
)
from app.services.complaint_service import ComplaintService
from app.tasks.ai_tasks import process_complaint

router = APIRouter(prefix="/submissions", tags=["complaints"])


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    service = ComplaintService(db)
    complaint = await service.create(data, current_user.id)
    process_complaint.delay(str(complaint.id))
    return ComplaintResponse.model_validate(complaint)


@router.get("", response_model=PaginatedComplaints)
async def list_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    category: str | None = Query(None),
    ward: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedComplaints:
    service = ComplaintService(db)
    constituency_id: uuid.UUID | None = None
    if current_user.role == "mp":
        constituency_id = current_user.constituency_id
    return await service.list(
        user_id=current_user.id if current_user.role == "citizen" else None,
        constituency_id=constituency_id,
        status=status,
        category=category,
        ward=ward,
        page=page,
        limit=limit,
    )


@router.get("/stats", response_model=ComplaintStats)
async def get_complaint_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintStats:
    service = ComplaintService(db)
    return await service.get_stats(current_user.id)


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    service = ComplaintService(db)
    complaint = await service.get_by_id(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found")
    return ComplaintResponse.model_validate(complaint)


@router.put("/{complaint_id}/feedback")
async def submit_feedback(
    complaint_id: uuid.UUID,
    data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = ComplaintService(db)
    complaint = await service.get_by_id(complaint_id)
    if not complaint:
        raise NotFoundError("Complaint not found")
    await service.update_feedback(complaint_id, data.rating, data.comment)
    return {"detail": "Feedback submitted successfully"}
