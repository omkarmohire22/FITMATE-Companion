"""add_trainee_enhanced_fields

Revision ID: bf7896e5841g
Revises: ad4f806e491d
Create Date: 2025-12-10 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf7896e5841g'
down_revision: Union[str, Sequence[str], None] = 'ad4f806e491d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new fields to trainees table."""
    # Add new columns to trainees table - check if they exist first
    op.add_column('trainees', sa.Column('fitness_goals', sa.Text(), nullable=True))
    op.add_column('trainees', sa.Column('date_of_birth', sa.Date(), nullable=True))
    op.add_column('trainees', sa.Column('gender', sa.String(length=20), nullable=True))
    op.add_column('trainees', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('trainees', sa.Column('emergency_contact_name', sa.String(length=100), nullable=True))
    op.add_column('trainees', sa.Column('emergency_contact_phone', sa.String(length=20), nullable=True))
    op.add_column('trainees', sa.Column('health_conditions', sa.Text(), nullable=True))


def downgrade() -> None:
    """Remove new fields from trainees table."""
    op.drop_column('trainees', 'health_conditions')
    op.drop_column('trainees', 'emergency_contact_phone')
    op.drop_column('trainees', 'emergency_contact_name')
    op.drop_column('trainees', 'address')
    op.drop_column('trainees', 'gender')
    op.drop_column('trainees', 'date_of_birth')
    op.drop_column('trainees', 'fitness_goals')
