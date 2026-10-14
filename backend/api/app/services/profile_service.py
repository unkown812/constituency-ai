import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.profile import ProfileUpdate
from app.utils.supabase_storage import upload_file


class ProfileService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_profile(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_profile(
        self, user_id: uuid.UUID, data: ProfileUpdate
    ) -> User:
        user = await self.get_profile(user_id)
        if not user:
            raise NotFoundError("User not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def upload_avatar(
        self, user_id: uuid.UUID, file_data: bytes, filename: str
    ) -> str:
        avatar_url = await upload_file(file_data, "avatars", filename)

        user = await self.get_profile(user_id)
        if user:
            user.avatar_url = avatar_url
            await self.db.commit()

        return avatar_url
