"""add_referral_columns

Revision ID: a005a366cbfe
Revises: 54027bef38e7
Create Date: 2024-03-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a005a366cbfe'
down_revision: Union[str, None] = '54027bef38e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create a new table with the desired schema
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('referral_code', sa.String(10), nullable=True))
        batch_op.add_column(sa.Column('referred_by', sa.String(36), nullable=True))
        batch_op.add_column(sa.Column('referral_count', sa.Integer(), nullable=False, server_default='0'))
        
        # Add unique constraint for referral_code
        batch_op.create_unique_constraint('uq_users_referral_code', ['referral_code'])
        
        # Add foreign key constraint for referred_by
        batch_op.create_foreign_key(
            'fk_users_referred_by',
            'users',
            ['referred_by'],
            ['id'],
            ondelete='SET NULL'
        )


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        # Remove foreign key constraint
        batch_op.drop_constraint('fk_users_referred_by', type_='foreignkey')
        
        # Remove unique constraint
        batch_op.drop_constraint('uq_users_referral_code', type_='unique')
        
        # Remove columns
        batch_op.drop_column('referral_count')
        batch_op.drop_column('referred_by')
        batch_op.drop_column('referral_code')
