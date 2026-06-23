"""add staff profile fields

Revision ID: b2e1c7d5a8f4
Revises: 9a7b6c1f4e2b
Create Date: 2026-05-25

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2e1c7d5a8f4"
down_revision = "9a7b6c1f4e2b"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("department", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("skills", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("staff_about", sa.Text(), nullable=True))


def downgrade():
    op.drop_column("users", "staff_about")
    op.drop_column("users", "skills")
    op.drop_column("users", "department")
    op.drop_column("users", "address")
