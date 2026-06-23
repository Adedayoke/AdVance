"""add deployment evidence and prime staff

Revision ID: 9a7b6c1f4e2b
Revises: c5e9a1d2b7f0
Create Date: 2026-05-25

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "9a7b6c1f4e2b"
down_revision = "c5e9a1d2b7f0"
branch_labels = None
depends_on = None


def upgrade():
    # deployments: evidence + confirmation metadata
    op.add_column("deployments", sa.Column("evidence", sa.JSON(), nullable=True))
    op.add_column(
        "deployments",
        sa.Column("confirmed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("deployments", sa.Column("confirmed_by", sa.UUID(), nullable=True))
    op.add_column("deployments", sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))

    # users: prime staff flag
    op.add_column(
        "users",
        sa.Column("is_prime_staff", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade():
    op.drop_column("users", "is_prime_staff")
    op.drop_column("deployments", "confirmed_at")
    op.drop_column("deployments", "confirmed_by")
    op.drop_column("deployments", "confirmed")
    op.drop_column("deployments", "evidence")
