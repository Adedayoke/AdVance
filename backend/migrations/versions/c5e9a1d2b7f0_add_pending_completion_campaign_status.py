"""add pending completion campaign status

Revision ID: c5e9a1d2b7f0
Revises: 7246bffb5133
Create Date: 2026-05-25 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = "c5e9a1d2b7f0"
down_revision = "7246bffb5133"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE campaign_status ADD VALUE IF NOT EXISTS 'pending_completion'")


def downgrade():
    # PostgreSQL does not support dropping enum values directly.
    # Leave as no-op for development rollback safety.
    pass
