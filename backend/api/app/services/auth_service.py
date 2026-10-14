import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.schemas.auth import UserBrief


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def send_otp(self, phone: str) -> dict:
        return {
            "success": True,
            "message": "OTP sent successfully",
            "expires_in": 300,
        }

    async def verify_otp(self, phone: str, otp: str) -> dict:
        user = await self.get_or_create_user(phone)

        expires_in = 1800
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        user_brief = UserBrief(
            id=user.id,
            full_name=user.full_name,
            phone=user.phone,
            role=user.role.value if hasattr(user.role, "value") else user.role,
            is_new_user=user.full_name is None,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "user": user_brief,
        }

    async def refresh_token(self, refresh_token_str: str) -> dict:
        payload = decode_token(refresh_token_str)
        if payload is None:
            raise UnauthorizedError("Invalid or expired refresh token")
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid token payload")

        result = await self.db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise UnauthorizedError("User not found")

        new_access = create_access_token(subject=str(user.id))
        new_refresh = create_refresh_token(subject=str(user.id))

        return {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer",
            "expires_in": 1800,
        }

    async def get_or_create_user(self, phone: str) -> User:
        result = await self.db.execute(
            select(User).where(User.phone == phone)
        )
        user = result.scalar_one_or_none()
        if user is None:
            user = User(phone=phone)
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        return user
