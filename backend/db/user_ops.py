import uuid
import jwt
from datetime import datetime, timedelta
from typing import Optional, List
import json

from sqlalchemy import Column, String, Integer, select
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable

from .db import Base, AsyncSessionLocal, JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_DAYS


class User(SQLAlchemyBaseUserTable[uuid.UUID], Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hashed_password = Column(String(1024), nullable=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    points = Column(Integer, nullable=False, default=0)
    completed_tasks = Column(Integer, nullable=False, default=0)
    topics = Column(String, nullable=True, default="[]")  # Store as JSON string
    languages = Column(String, nullable=True, default="[]")  # Store as JSON string

    def generate_token(self) -> str:
        """Generate JWT token for user."""
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
        payload = {
            "sub": str(self.id),
            "email": self.email,
            "exp": expire
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """Verify JWT token and return payload."""
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.PyJWTError:
            return None

    def add_points(self, points_to_add: int) -> None:
        """Add points to user total."""
        self.points += points_to_add

    def increment_completed_tasks(self) -> None:
        """Increment completed tasks count."""
        self.completed_tasks += 1

    async def get_completed_tasks(self, session) -> List:
        """Get all tasks completed by this user."""
        from .tasks_ops import Task  # Import here to avoid circular imports
        result = await session.execute(
            select(Task).where(Task.completed_by == self.id)
        )
        return list(result.scalars().all())

    def set_topics(self, topics: List[str]) -> None:
        """Set user's topics."""
        self.topics = json.dumps(topics)

    def get_topics(self) -> List[str]:
        """Get user's topics."""
        return json.loads(self.topics or "[]")

    def set_languages(self, languages: List[str]) -> None:
        """Set user's languages."""
        self.languages = json.dumps(languages)

    def get_languages(self) -> List[str]:
        """Get user's languages."""
        return json.loads(self.languages or "[]")


async def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()


async def get_or_create_user(
    email: str,
    name: Optional[str] = None,
    hashed_password: Optional[str] = None,
    picture: Optional[str] = None,
) -> User:
    """Get existing user or create new one."""
    async with AsyncSessionLocal() as session:
        # Look up existing user
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        # Create if doesn't exist
        if not user:
            user = User(
                email=email,
                hashed_password=hashed_password,
                name=name,
                picture=picture
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

        return user


async def get_user_completed_tasks(user_id: str) -> List:
    """Get all tasks completed by a user, sorted by most recent."""
    from .tasks_ops import Task  # Import here to avoid circular imports
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Task)
            .where(Task.completed_by == user_id)
            .order_by(Task.updated_at.desc())
        )
        return list(result.scalars().all())


async def update_user_topics(user_id: str, topics: List[str]) -> bool:
    """Update user's topics."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return False
        user.set_topics(topics)
        await session.commit()
        return True


async def update_user_languages(user_id: str, languages: List[str]) -> bool:
    """Update user's languages."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return False
        user.set_languages(languages)
        await session.commit()
        return True


async def get_user_interests(user_id: str) -> dict:
    """Get user's topics and languages."""
    async with AsyncSessionLocal() as session:
        user = await get_user_by_id(user_id)
        if not user:
            return {"topics": [], "languages": []}
        
        return {
            "topics": user.get_topics(),
            "languages": user.get_languages()
        }