"""Fix model-migration mismatches: add missing columns and update enums

Revision ID: 002
Revises: 001
Create Date: 2026-07-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add mp to userrole enum
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'mp'")

    # Add missing columns to users table
    op.add_column(
        "users",
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )

    # Add missing columns to complaints table
    op.add_column(
        "complaints",
        sa.Column("description_en", sa.Text(), nullable=True),
    )
    op.add_column(
        "complaints",
        sa.Column("is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "complaints",
        sa.Column("pipeline_version", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "complaints",
        sa.Column("pipeline_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "complaints",
        sa.Column("ai_services_used", sa.JSON(), nullable=True),
    )

    # Add missing columns to projects table
    op.add_column(
        "projects",
        sa.Column("constituency_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("created_by", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_projects_constituency_id",
        "projects", "constituencies",
        ["constituency_id"], ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_projects_created_by",
        "projects", "users",
        ["created_by"], ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_projects_constituency_id"),
        "projects", ["constituency_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_projects_constituency_id"), table_name="projects")
    op.drop_constraint("fk_projects_created_by", "projects", type_="foreignkey")
    op.drop_constraint("fk_projects_constituency_id", "projects", type_="foreignkey")
    op.drop_column("projects", "created_by")
    op.drop_column("projects", "constituency_id")
    op.drop_column("complaints", "ai_services_used")
    op.drop_column("complaints", "pipeline_completed_at")
    op.drop_column("complaints", "pipeline_version")
    op.drop_column("complaints", "is_deleted")
    op.drop_column("complaints", "description_en")
    op.drop_column("users", "is_verified")

    # Note: cannot easily remove an enum value in PostgreSQL downgrade
    # The mp value will remain in the enum type
