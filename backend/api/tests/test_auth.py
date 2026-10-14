import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_send_otp(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/send-otp",
        json={"phone": "+919876543210"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "success" in data
    assert "message" in data
    assert "expires_in" in data


@pytest.mark.asyncio
async def test_send_otp_invalid_phone(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/send-otp",
        json={"phone": ""},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_verify_otp(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": "+919876543210", "otp": "123456"},
    )
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_verify_otp_short_otp(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": "+919876543210", "otp": "123"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_verify_otp_long_otp(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": "+919876543210", "otp": "123456789"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "some-valid-refresh-token"},
    )
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
