"""Merge migration heads

Revision ID: 3d74f32ad8c0
Revises: 852fa786cde3, c1a2b3c4d5e6
Create Date: 2025-12-24 19:11:42.292665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3d74f32ad8c0'
down_revision: Union[str, Sequence[str], None] = ('852fa786cde3', 'c1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
