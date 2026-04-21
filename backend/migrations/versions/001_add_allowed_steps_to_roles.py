"""add allowed_steps to roles

Revision ID: 001
Revises:
Create Date: 2026-04-21
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE roles ADD COLUMN IF NOT EXISTS allowed_steps JSON")


def downgrade() -> None:
    op.drop_column('roles', 'allowed_steps')
