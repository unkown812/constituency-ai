import uuid
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.security import decode_token, decode_supabase_token
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.models.user import User
from sqlalchemy import select

async def get_current_user(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise UnauthorizedError("Invalid authorization header")
    token = authorization.split(" ")[1]

    payload = decode_token(token)
    if payload is None:
        payload = decode_supabase_token(token)

    if payload is None:
        raise UnauthorizedError("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    try:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if user is not None:
            return user
    except (ValueError, Exception):
        pass

    phone = payload.get("phone") or payload.get("user_metadata", {}).get("phone")
    if phone:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
        if user is not None:
            return user

    raise UnauthorizedError("User not found")

async def get_optional_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if payload is None:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    return result.scalar_one_or_none()

async def require_role(role: str, user: User = Depends(get_current_user)) -> User:
    if user.role != role and user.role != "admin":
        raise ForbiddenError(f"Requires {role} role")
    return user

async def require_mp_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("mp", "admin"):
        raise ForbiddenError("Requires MP or admin role")
    return user
