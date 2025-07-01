import os
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Database setup
Base = declarative_base()

# Get the absolute path to the backend directory
backend_dir = Path(__file__).parent.parent
db_path = backend_dir / "db" / "app.db"

# Ensure the db directory exists
db_path.parent.mkdir(exist_ok=True)

# Use absolute path for database
DB_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_path}")
engine = create_async_engine(DB_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def init_models() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_all_tables() -> None:
    """Drop all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def drop_tasks_table() -> None:
    """Drop and recreate only the tasks table."""
    from db.tasks_ops import Task
    async with engine.begin() as conn:
        await conn.run_sync(Task.__table__.drop, checkfirst=True)
        await conn.run_sync(Task.__table__.create, checkfirst=True)

