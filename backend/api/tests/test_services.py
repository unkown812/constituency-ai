import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import func

from app.core.exceptions import NotFoundError
from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus
from app.schemas.complaint import ComplaintCreate
from app.services.complaint_service import ComplaintService


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def service(mock_db):
    return ComplaintService(mock_db)


@pytest.fixture
def sample_complaint_data():
    return ComplaintCreate(
        description="A large pothole on MG Road causing accidents and traffic jams",
        category="roads",
        latitude=12.9716,
        longitude=77.5946,
        address="MG Road, Bangalore",
    )


@pytest.fixture
def sample_complaint():
    return Complaint(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        description="A large pothole on MG Road",
        category="roads",
        status="new",
        image_urls=[],
        is_deleted=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


class TestComplaintServiceCreate:
    @pytest.mark.asyncio
    async def test_create_complaint_success(self, service, mock_db, sample_complaint_data):
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        user_id = uuid.uuid4()
        result = await service.create(sample_complaint_data, user_id)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()
        mock_db.refresh.assert_awaited_once()
        assert result.description == sample_complaint_data.description
        assert result.category == sample_complaint_data.category

    @pytest.mark.asyncio
    async def test_create_complaint_without_location(self, service, mock_db):
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        data = ComplaintCreate(
            description="Water supply issue in Ward 5, no water for 3 days",
            category="water",
        )
        user_id = uuid.uuid4()
        result = await service.create(data, user_id)

        mock_db.add.assert_called_once()
        assert result.category == "water"
        assert result.location is None

    @pytest.mark.asyncio
    async def test_create_complaint_with_image_urls(self, service, mock_db):
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        data = ComplaintCreate(
            description="Garbage dump near school creating health hazard",
            category="sanitation",
            image_urls=["https://example.com/image1.jpg"],
        )
        user_id = uuid.uuid4()
        result = await service.create(data, user_id)

        mock_db.add.assert_called_once()
        assert result.image_urls == ["https://example.com/image1.jpg"]


class TestComplaintServiceGetById:
    @pytest.mark.asyncio
    async def test_get_by_id_found(self, service, mock_db, sample_complaint):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_complaint
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await service.get_by_id(sample_complaint.id)
        assert result is not None
        assert result.id == sample_complaint.id
        assert result.category == "roads"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, service, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await service.get_by_id(uuid.uuid4())
        assert result is None


class TestComplaintServiceList:
    @pytest.mark.asyncio
    async def test_list_by_user(self, service, mock_db, sample_complaint):
        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 1
        mock_items_result = MagicMock()
        mock_items_result.scalars.return_value.all.return_value = [sample_complaint]

        expected_calls = [mock_count_result, mock_items_result]
        mock_db.execute = AsyncMock(side_effect=expected_calls)

        user_id = uuid.uuid4()
        items, total = await service.list_by_user(user_id)

        assert total == 1
        assert len(items) == 1
        assert items[0].category == "roads"

    @pytest.mark.asyncio
    async def test_list_by_user_with_status_filter(self, service, mock_db):
        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 0
        mock_items_result = MagicMock()
        mock_items_result.scalars.return_value.all.return_value = []

        mock_db.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        user_id = uuid.uuid4()
        items, total = await service.list_by_user(user_id, status="resolved")

        assert total == 0
        assert items == []

    @pytest.mark.asyncio
    async def test_list_by_user_empty(self, service, mock_db):
        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 0
        mock_items_result = MagicMock()
        mock_items_result.scalars.return_value.all.return_value = []

        mock_db.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        user_id = uuid.uuid4()
        items, total = await service.list_by_user(user_id)

        assert total == 0
        assert items == []


class TestComplaintServiceListByConstituency:
    @pytest.mark.asyncio
    async def test_list_by_constituency(self, service, mock_db, sample_complaint):
        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 1
        mock_items_result = MagicMock()
        mock_items_result.scalars.return_value.all.return_value = [sample_complaint]

        mock_db.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        constituency_id = uuid.uuid4()
        items, total = await service.list_by_constituency(constituency_id)

        assert total == 1
        assert len(items) == 1

    @pytest.mark.asyncio
    async def test_list_by_constituency_with_filters(self, service, mock_db):
        mock_count_result = MagicMock()
        mock_count_result.scalar_one.return_value = 0
        mock_items_result = MagicMock()
        mock_items_result.scalars.return_value.all.return_value = []

        mock_db.execute = AsyncMock(side_effect=[mock_count_result, mock_items_result])

        constituency_id = uuid.uuid4()
        items, total = await service.list_by_constituency(
            constituency_id, status="new", category="roads"
        )

        assert total == 0


def _mock_count(value):
    m = MagicMock()
    m.scalar_one.return_value = value
    return m

class TestComplaintServiceGetStats:
    @pytest.mark.asyncio
    async def test_get_stats(self, service, mock_db):
        mock_db.execute = AsyncMock()
        mock_db.execute.side_effect = [
            _mock_count(100),
            _mock_count(10),
            _mock_count(5),
            _mock_count(15),
            [("new", 50), ("resolved", 30), ("under_review", 15)],
        ]

        user_id = uuid.uuid4()
        stats = await service.get_stats(user_id)

        assert stats["total"] == 100
        assert stats["this_month"] == 10
        assert stats["resolved_this_month"] == 5
        assert stats["under_review"] == 15
        assert stats["by_status"]["new"] == 50

    @pytest.mark.asyncio
    async def test_get_stats_empty(self, service, mock_db):
        mock_db.execute = AsyncMock()
        mock_db.execute.side_effect = [
            _mock_count(0),
            _mock_count(0),
            _mock_count(0),
            _mock_count(0),
            [],
        ]

        user_id = uuid.uuid4()
        stats = await service.get_stats(user_id)

        assert stats["total"] == 0
        assert stats["by_status"] == {}


class TestComplaintServiceUpdateFeedback:
    @pytest.mark.asyncio
    async def test_update_feedback_success(self, service, mock_db, sample_complaint):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_complaint
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await service.update_feedback(
            sample_complaint.id, rating="thumbs_up", comment="Great job!"
        )

        mock_db.commit.assert_awaited_once()
        assert result.feedback_rating == "thumbs_up"
        assert result.feedback_comment == "Great job!"

    @pytest.mark.asyncio
    async def test_update_feedback_not_found(self, service, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(NotFoundError):
            await service.update_feedback(
                uuid.uuid4(), rating="thumbs_up", comment=None
            )


class TestComplaintServiceMarkDuplicate:
    @pytest.mark.asyncio
    async def test_mark_duplicate_success(self, service, mock_db, sample_complaint):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_complaint
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        duplicate_of_id = uuid.uuid4()
        result = await service.mark_duplicate(sample_complaint.id, duplicate_of_id)

        mock_db.commit.assert_awaited_once()
        assert result.duplicate_of_id == duplicate_of_id
        assert result.status == ComplaintStatus.closed.value

    @pytest.mark.asyncio
    async def test_mark_duplicate_not_found(self, service, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(NotFoundError):
            await service.mark_duplicate(uuid.uuid4(), uuid.uuid4())


class TestComplaintServiceUpdateAIResults:
    @pytest.mark.asyncio
    async def test_update_ai_results_success(self, service, mock_db, sample_complaint):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_complaint
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        ai_data = {
            "ai_summary": "Pothole complaint verified",
            "ai_confidence": 0.95,
            "urgency_score": 0.8,
            "category": "roads",
            "status": "analyzed",
            "ward": "Ward 5",
        }
        result = await service.update_ai_results(sample_complaint.id, ai_data)

        mock_db.commit.assert_awaited_once()
        assert result.ai_summary == "Pothole complaint verified"
        assert result.ai_confidence == 0.95
        assert result.urgency_score == 0.8
        assert result.ward == "Ward 5"

    @pytest.mark.asyncio
    async def test_update_ai_results_not_found(self, service, mock_db):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(NotFoundError):
            await service.update_ai_results(uuid.uuid4(), {"ai_summary": "test"})

    @pytest.mark.asyncio
    async def test_update_ai_results_partial(self, service, mock_db, sample_complaint):
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_complaint
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await service.update_ai_results(
            sample_complaint.id, {"title": "Updated Title"}
        )

        assert result.title == "Updated Title"
