from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    data: SendOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> SendOTPResponse:
    service = AuthService(db)
    return await service.send_otp(data)


@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(
    data: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> VerifyOTPResponse:
    service = AuthService(db)
    return await service.verify_otp(data)


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> RefreshTokenResponse:
    service = AuthService(db)
    return await service.refresh_token(data)
