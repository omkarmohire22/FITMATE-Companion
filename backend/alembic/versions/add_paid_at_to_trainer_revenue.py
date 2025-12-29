"""
Add paid_at column to trainer_revenue

Revision ID: add_paid_at_to_trainer_revenue
Revises: af4595e4740f
Create Date: 2025-12-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_paid_at_to_trainer_revenue'
down_revision = 'af4595e4740f'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('trainer_revenue', sa.Column('paid_at', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('trainer_revenue', 'paid_at')
