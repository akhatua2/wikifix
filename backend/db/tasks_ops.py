from typing import List, Optional
from sqlalchemy import select, ForeignKey, Column, String, DateTime, Boolean
from sqlalchemy.ext.asyncio import AsyncSession
from .db import AsyncSessionLocal, Base
from db.user_ops import User
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy.types import Enum as SQLAlchemyEnum

class TaskStatus(PyEnum):
    OPEN = "OPEN"           # Change to uppercase
    COMPLETED = "COMPLETED" # Change to uppercase

class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    text = Column(String, nullable=False)
    context = Column(String, nullable=False, default="")
    status = Column(SQLAlchemyEnum(TaskStatus), nullable=False, default=TaskStatus.OPEN)
    completed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    user_agrees = Column(Boolean, nullable=True)  # True if user agrees with claim
    user_analysis = Column(String, nullable=True)  # User's analysis
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

async def get_task(task_id: str) -> Optional[Task]:
    """Get a single task by its ID."""
    async with AsyncSessionLocal() as session:
        stmt = select(Task).where(Task.id == task_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

async def get_all_tasks() -> List[Task]:
    """Get all tasks."""
    async with AsyncSessionLocal() as session:
        stmt = select(Task)
        result = await session.execute(stmt)
        return list(result.scalars().all())

async def get_open_tasks() -> List[Task]:
    """Get all tasks that are in OPEN status."""
    async with AsyncSessionLocal() as session:
        stmt = select(Task).where(Task.status == TaskStatus.OPEN)
        result = await session.execute(stmt)
        return list(result.scalars().all())

async def get_random_open_task() -> Optional[Task]:
    """Get a random task that is in OPEN status."""
    # First get all open tasks
    open_tasks = await get_open_tasks()
    if not open_tasks:
        return None
    
    # Randomly select a task ID
    import random
    random_task = random.choice(open_tasks)
    
    # Get the full task details using get_task
    return await get_task(random_task.id)

async def complete_task(
    task_id: str,
    user_id: str,
    agrees_with_claim: bool,
    user_analysis: str
) -> bool:
    """Complete a task and update user points."""
    print(f"=== Starting task completion ===")
    print(f"Task ID: {task_id}")
    print(f"User ID: {user_id}")
    print(f"Agrees with claim: {agrees_with_claim}")
    print(f"User analysis length: {len(user_analysis)} characters")

    async with AsyncSessionLocal() as session:
        # Get task and user
        task = await session.get(Task, task_id)
        user = await session.get(User, user_id)
        
        if not task or not user or task.status != TaskStatus.OPEN:
            print(f"=== Task completion failed ===")
            print(f"Task exists: {bool(task)}")
            print(f"User exists: {bool(user)}")
            print(f"Task status: {task.status if task else 'N/A'}")
            return False
        
        print(f"=== Updating task and user ===")
        # Update task
        task.status = TaskStatus.COMPLETED
        task.completed_by = user_id
        task.user_agrees = agrees_with_claim
        task.user_analysis = user_analysis
        task.updated_at = datetime.utcnow()
        
        # Update user points
        points = 25 if not agrees_with_claim else 10  # More points for disagreeing
        print(f"Awarding {points} points to user")
        user.add_points(points)
        user.increment_completed_tasks()
        
        await session.commit()
        print(f"=== Task completion successful ===")
        print(f"Task ID: {task_id}")
        print(f"User ID: {user_id}")
        return True