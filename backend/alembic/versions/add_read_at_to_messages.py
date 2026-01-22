"""Add read_at timestamp field to messages table

Revision ID: 9e8f7c1d2a3b
Revises: fac9e4c4578a
Create Date: 2026-01-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9e8f7c1d2a3b'
down_revision = 'fac9e4c4578a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add read_at column to messages table
    op.add_column('messages', sa.Column('read_at', sa.DateTime(timezone=True), nullable=True))
    
    # Add index on is_read for faster queries
    op.create_index('ix_messages_is_read', 'messages', ['is_read'])


def downgrade() -> None:
    # Drop the index first
    op.drop_index('ix_messages_is_read', table_name='messages')
    
    # Remove read_at column
    op.drop_column('messages', 'read_at')
