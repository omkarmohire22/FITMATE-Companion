"""add_trainer_experience_fields

Revision ID: ad4f806e491d
Revises: add_paid_at_to_trainer_revenue
Create Date: 2025-12-10 18:42:21.204259

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ad4f806e491d'
down_revision: Union[str, Sequence[str], None] = 'add_paid_at_to_trainer_revenue'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Only add the trainer columns we need
    op.add_column('trainers', sa.Column('experience_years', sa.Integer(), nullable=True))
    op.add_column('trainers', sa.Column('certifications', sa.String(length=500), nullable=True))
    op.add_column('trainers', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.add_column('trainers', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('trainers', 'created_at')
    op.drop_column('trainers', 'is_active')
    op.drop_column('trainers', 'certifications')
    op.drop_column('trainers', 'experience_years')
