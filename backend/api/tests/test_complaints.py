import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_complaint(client: AsyncClient):
    response = await client.post(
        "/api/v1/submissions",
        json={
            "description": "Large pothole on MG Road causing accidents and traffic jams daily",
            "category": "roads",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "address": "MG Road, Bangalore",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["category"] == "roads"
    assert data["status"] == "new"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_complaint_missing_required_fields(client: AsyncClient):
    response = await client.post(
        "/api/v1/submissions",
        json={"category": "roads"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_complaint_description_too_short(client: AsyncClient):
    response = await client.post(
        "/api/v1/submissions",
        json={
            "description": "Short",
            "category": "roads",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_complaints(client: AsyncClient):
    response = await client.get("/api/v1/submissions")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data


@pytest.mark.asyncio
async def test_list_complaints_with_pagination(client: AsyncClient):
    response = await client.get("/api/v1/submissions?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 10


@pytest.mark.asyncio
async def test_list_complaints_with_status_filter(client: AsyncClient):
    response = await client.get("/api/v1/submissions?status=new")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_get_complaint_not_found(client: AsyncClient):
    fake_id = uuid.uuid4()
    response = await client.get(f"/api/v1/submissions/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_complaint_invalid_uuid(client: AsyncClient):
    response = await client.get("/api/v1/submissions/not-a-valid-uuid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_complaint_stats(client: AsyncClient):
    response = await client.get("/api/v1/submissions/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "this_month" in data
    assert "by_status" in data
    assert "resolved_this_month" in data
    assert "under_review" in data


@pytest.mark.asyncio
async def test_submit_feedback_not_found(client: AsyncClient):
    fake_id = uuid.uuid4()
    response = await client.put(
        f"/api/v1/submissions/{fake_id}/feedback",
        json={"rating": "thumbs_up"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_submit_feedback_invalid_rating(client: AsyncClient):
    fake_id = uuid.uuid4()
    response = await client.put(
        f"/api/v1/submissions/{fake_id}/feedback",
        json={"rating": "invalid_rating"},
    )
    assert response.status_code == 422
