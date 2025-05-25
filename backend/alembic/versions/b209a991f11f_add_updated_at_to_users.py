"""add_updated_at_to_users

Revision ID: b209a991f11f
Revises: a005a366cbfe
Create Date: 2024-03-21 10:00:00.000000

"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b209a991f11f'
down_revision: Union[str, None] = 'a005a366cbfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add updated_at column with default value
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('updated_at')
