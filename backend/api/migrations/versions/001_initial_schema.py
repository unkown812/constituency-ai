"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2026-07-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "constituencies",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("boundary", geoalchemy2.Geometry("MULTIPOLYGON", srid=4326), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_constituencies_name"), "constituencies", ["name"], unique=True)

    op.create_table(
        "wards",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("constituency_id", sa.UUID(), nullable=False),
        sa.Column("boundary", geoalchemy2.Geometry("MULTIPOLYGON", srid=4326), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["constituency_id"], ["constituencies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_wards_constituency_id"), "wards", ["constituency_id"])

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("constituency_id", sa.UUID(), nullable=True),
        sa.Column("preferred_language", sa.String(), nullable=False, server_default="en"),
        sa.Column("notification_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("role", sa.Enum("citizen", "admin", "officer", "supervisor", name="userrole"), nullable=False, server_default="citizen"),
        sa.Column("is_new_user", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["constituency_id"], ["constituencies.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_phone"), "users", ["phone"], unique=True)

    op.create_table(
        "complaints",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("original_description", sa.String(), nullable=True),
        sa.Column("original_language", sa.String(), nullable=True),
        sa.Column("category", sa.Enum("roads", "sanitation", "water", "electricity", "public_safety", "health", "education", "other", name="complaintcategory"), nullable=False),
        sa.Column("status", sa.Enum("submitted", "under_review", "in_progress", "resolved", "closed", "rejected", name="complaintstatus"), nullable=False, server_default="submitted"),
        sa.Column("location", geoalchemy2.Geometry("POINT", srid=4326), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("ward", sa.String(), nullable=True),
        sa.Column("constituency_id", sa.UUID(), nullable=True),
        sa.Column("image_urls", sa.JSON(), nullable=False, server_default='[]'),
        sa.Column("document_url", sa.String(), nullable=True),
        sa.Column("voice_url", sa.String(), nullable=True),
        sa.Column("voice_transcript", sa.String(), nullable=True),
        sa.Column("ai_summary", sa.String(), nullable=True),
        sa.Column("ai_confidence", sa.Float(), nullable=True),
        sa.Column("urgency_score", sa.Float(), nullable=True),
        sa.Column("feedback_rating", sa.Enum("1", "2", "3", "4", "5", name="feedbackrating"), nullable=True),
        sa.Column("feedback_comment", sa.String(), nullable=True),
        sa.Column("duplicate_of_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["constituency_id"], ["constituencies.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["duplicate_of_id"], ["complaints.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_complaints_user_id"), "complaints", ["user_id"])
    op.create_index(op.f("ix_complaints_constituency_id"), "complaints", ["constituency_id"])
    op.create_index(op.f("ix_complaints_status"), "complaints", ["status"])
    op.create_index(op.f("ix_complaints_category"), "complaints", ["category"])
    op.create_index(op.f("ix_complaints_created_at"), "complaints", ["created_at"])

    op.create_table(
        "projects",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="proposed"),
        sa.Column("priority_score", sa.Float(), nullable=True),
        sa.Column("priority_label", sa.String(), nullable=True),
        sa.Column("reasoning", sa.String(), nullable=True),
        sa.Column("estimated_cost", sa.Float(), nullable=True),
        sa.Column("ward", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_created_at"), "projects", ["created_at"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.Enum("status_change", "ai_analysis_complete", "weekly_digest", "general", name="notificationtype"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("body", sa.String(), nullable=False),
        sa.Column("submission_id", sa.UUID(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"])
    op.create_index(op.f("ix_notifications_created_at"), "notifications", ["created_at"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("projects")
    op.drop_table("complaints")
    op.drop_table("users")
    op.drop_table("wards")
    op.drop_table("constituencies")
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS feedbackrating")
    op.execute("DROP TYPE IF EXISTS complaintstatus")
    op.execute("DROP TYPE IF EXISTS complaintcategory")
    op.execute("DROP TYPE IF EXISTS userrole")
