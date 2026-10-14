from uuid import UUID

from pydantic import BaseModel, Field


class UserBrief(BaseModel):
    id: UUID
    full_name: str | None
    phone: str
    role: str
    is_new_user: bool


class SendOTPRequest(BaseModel):
    phone: str


class SendOTPResponse(BaseModel):
    success: bool
    message: str
    expires_in: int


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str = Field(..., min_length=4, max_length=8)


class VerifyOTPResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserBrief


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
