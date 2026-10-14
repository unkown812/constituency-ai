import uuid

import pytest
from pydantic import ValidationError

from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintListItem,
    PaginatedComplaints,
    ComplaintStats,
    ComplaintLocation,
    TimelineEvent,
    FeedbackRequest,
)
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    UserBrief,
)
from app.schemas.assistant import ChatRequest, ChatResponse


class TestComplaintSchemas:
    def test_complaint_create_valid(self):
        data = ComplaintCreate(
            description="Large pothole on MG Road causing accidents daily",
            category="roads",
            latitude=12.9716,
            longitude=77.5946,
        )
        assert data.description == "Large pothole on MG Road causing accidents daily"
        assert data.category == "roads"
        assert data.latitude == 12.9716
        assert data.longitude == 77.5946
        assert data.address is None
        assert data.image_urls == []
        assert data.document_url is None

    def test_complaint_create_defaults(self):
        data = ComplaintCreate(
            description="Water supply issue in Ward 5, no water for 3 days",
        )
        assert data.category == "other"
        assert data.latitude is None
        assert data.longitude is None
        assert data.address is None

    def test_complaint_create_too_short(self):
        with pytest.raises(ValidationError):
            ComplaintCreate(description="Short", category="roads")

    def test_complaint_create_invalid_latitude(self):
        with pytest.raises(ValidationError):
            ComplaintCreate(
                description="Test complaint with invalid lat",
                latitude=100.0,
                longitude=0.0,
            )

    def test_complaint_create_invalid_longitude(self):
        with pytest.raises(ValidationError):
            ComplaintCreate(
                description="Test complaint with invalid lng",
                latitude=0.0,
                longitude=200.0,
            )

    def test_complaint_location_valid(self):
        loc = ComplaintLocation(latitude=12.97, longitude=77.59, name="MG Road")
        assert loc.latitude == 12.97
        assert loc.longitude == 77.59
        assert loc.name == "MG Road"

    def test_complaint_location_without_name(self):
        loc = ComplaintLocation(latitude=12.97, longitude=77.59)
        assert loc.name is None

    def test_timeline_event(self):
        from datetime import datetime

        event = TimelineEvent(
            event="created",
            label="Complaint Created",
            date=datetime(2024, 1, 1),
            icon="plus-circle",
        )
        assert event.event == "created"
        assert event.icon == "plus-circle"

    def test_complaint_response(self):
        from datetime import datetime

        now = datetime.now()
        data = ComplaintResponse(
            id=uuid.uuid4(),
            title="Pothole on MG Road",
            description="Large pothole",
            category="roads",
            status="new",
            location=None,
            address=None,
            ward=None,
            constituency_id=None,
            image_urls=[],
            document_url=None,
            voice_url=None,
            voice_transcript=None,
            ai_summary=None,
            ai_confidence=None,
            urgency_score=None,
            feedback_rating=None,
            feedback_comment=None,
            created_at=now,
            updated_at=now,
        )
        assert data.category == "roads"
        assert data.status == "new"
        assert data.title == "Pothole on MG Road"

    def test_complaint_list_item(self):
        from datetime import datetime

        now = datetime.now()
        item = ComplaintListItem(
            id=uuid.uuid4(),
            title="Pothole",
            category="roads",
            status="new",
            location=None,
            thumbnail_url=None,
            image_count=0,
            created_at=now,
            updated_at=now,
        )
        assert item.category == "roads"

    def test_paginated_complaints(self):
        from datetime import datetime

        now = datetime.now()
        item = ComplaintListItem(
            id=uuid.uuid4(),
            title="Test",
            category="roads",
            status="new",
            location=None,
            created_at=now,
            updated_at=now,
        )
        page = PaginatedComplaints(
            items=[item],
            total=1,
            page=1,
            limit=20,
            total_pages=1,
        )
        assert page.total == 1
        assert len(page.items) == 1

    def test_complaint_stats(self):
        stats = ComplaintStats(
            total=100,
            this_month=10,
            by_status={"new": 50, "resolved": 30},
            resolved_this_month=5,
            under_review=15,
        )
        assert stats.total == 100
        assert stats.by_status["new"] == 50

    def test_feedback_request_valid(self):
        fb = FeedbackRequest(rating="thumbs_up", comment="Great work!")
        assert fb.rating == "thumbs_up"
        assert fb.comment == "Great work!"

    def test_feedback_request_empty(self):
        fb = FeedbackRequest()
        assert fb.rating is None
        assert fb.comment is None


class TestAuthSchemas:
    def test_send_otp_request_valid(self):
        data = SendOTPRequest(phone="+919876543210")
        assert data.phone == "+919876543210"

    def test_send_otp_response(self):
        data = SendOTPResponse(
            success=True,
            message="OTP sent successfully",
            expires_in=300,
        )
        assert data.success is True
        assert data.expires_in == 300

    def test_verify_otp_request_valid(self):
        data = VerifyOTPRequest(phone="+919876543210", otp="123456")
        assert data.phone == "+919876543210"
        assert data.otp == "123456"

    def test_verify_otp_request_too_short(self):
        with pytest.raises(ValidationError):
            VerifyOTPRequest(phone="+919876543210", otp="123")

    def test_verify_otp_request_too_long(self):
        with pytest.raises(ValidationError):
            VerifyOTPRequest(phone="+919876543210", otp="123456789")

    def test_verify_otp_response(self):
        data = VerifyOTPResponse(
            access_token="test-token",
            refresh_token="test-refresh-token",
            expires_in=3600,
            user=UserBrief(
                id=uuid.uuid4(),
                full_name="Test User",
                phone="+919876543210",
                role="citizen",
                is_new_user=False,
            ),
        )
        assert data.token_type == "bearer"
        assert data.user.phone == "+919876543210"

    def test_refresh_token_request(self):
        data = RefreshTokenRequest(refresh_token="some-refresh-token")
        assert data.refresh_token == "some-refresh-token"

    def test_refresh_token_response(self):
        data = RefreshTokenResponse(
            access_token="new-access-token",
            refresh_token="new-refresh-token",
            expires_in=3600,
        )
        assert data.token_type == "bearer"

    def test_user_brief(self):
        user = UserBrief(
            id=uuid.uuid4(),
            full_name="John Doe",
            phone="+919876543210",
            role="citizen",
            is_new_user=True,
        )
        assert user.full_name == "John Doe"
        assert user.is_new_user is True


class TestAssistantSchemas:
    def test_chat_request(self):
        data = ChatRequest(question="What are the top complaints in my area?")
        assert data.question == "What are the top complaints in my area?"

    def test_chat_request_empty(self):
        data = ChatRequest(question="")
        assert data.question == ""

    def test_chat_response(self):
        data = ChatResponse(
            answer="Based on recent data, the top complaints are about potholes.",
            sources=[{"title": "Complaint Report", "url": "https://example.com"}],
        )
        assert "potholes" in data.answer
        assert len(data.sources) == 1

    def test_chat_response_empty_sources(self):
        data = ChatResponse(answer="No data available")
        assert data.sources == []
