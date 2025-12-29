"""Add confidence column to nutrition_logs table

Revision ID: c1a2b3c4d5e6
Revises: bf7896e5841g
Create Date: 2025-12-11 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c1a2b3c4d5e6'
down_revision = 'bf7896e5841g'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add confidence column to nutrition_logs table
    op.add_column('nutrition_logs', sa.Column('confidence', sa.Float(), nullable=True, server_default='0.0'))


def downgrade() -> None:
    # Remove confidence column from nutrition_logs table
    op.drop_column('nutrition_logs', 'confidence')
