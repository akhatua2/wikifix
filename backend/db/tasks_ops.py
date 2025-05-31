from typing import List, Optional
from sqlalchemy import select, ForeignKey, Column, String, DateTime, Boolean, Text
from sqlalchemy.ext.asyncio import AsyncSession
from .db import AsyncSessionLocal, Base
from db.user_ops import User
import uuid
from datetime import datetime, UTC
from enum import Enum as PyEnum
from sqlalchemy.types import Enum as SQLAlchemyEnum

class TaskStatus(PyEnum):
    OPEN = "OPEN"           # Change to uppercase
    COMPLETED = "COMPLETED" # Change to uppercase

class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Claim part
    claim_sentence = Column(Text, nullable=False)
    claim_context = Column(Text, nullable=True)
    claim_document_title = Column(String, nullable=True)
    claim_text_span = Column(Text, nullable=True)
    claim_url = Column(String, nullable=True)
    
    # Evidence part
    evidence_sentence = Column(Text, nullable=False)
    evidence_context = Column(Text, nullable=True)  # This is the full evidence content
    evidence_document_title = Column(String, nullable=True)
    evidence_text_span = Column(Text, nullable=True)  # Specific span from evidence
    evidence_url = Column(String, nullable=True)
    
    # LLM analysis
    llm_analysis = Column(Text, nullable=True)
    contradiction_type = Column(String, nullable=True)
    
    # Task completion tracking
    status = Column(SQLAlchemyEnum(TaskStatus), nullable=False, default=TaskStatus.OPEN)
    completed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    user_agrees = Column(Boolean, nullable=True)
    user_analysis = Column(Text, nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    

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
        task.updated_at = datetime.now(UTC)
        
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

async def create_task_from_anli_result(anli_result: dict) -> str:
    """Create a new task from an ANLI result dictionary.
    
    Args:
        anli_result: Dictionary containing the ANLI analysis result
        
    Returns:
        The ID of the created task
    """
    async with AsyncSessionLocal() as session:
        task = Task(
            # Claim part
            claim_sentence=anli_result.get("claim", ""),
            claim_context=anli_result.get("claim_context", ""),
            claim_document_title=anli_result.get("document_title", ""),
            claim_text_span=anli_result.get("claim_text_span", ""),
            claim_url=anli_result.get("document_url", ""),
            
            # Evidence part
            evidence_sentence=anli_result.get("evidence_sentence", ""),
            evidence_context=anli_result.get("evidence", ""),
            evidence_document_title=anli_result.get("evidence_document_title", ""),
            evidence_text_span="",  # Not provided in current JSON format
            evidence_url=anli_result.get("evidence_url", ""),
            
            # LLM analysis
            llm_analysis=anli_result.get("llm_report", {}).get("analysis", ""),
            contradiction_type=anli_result.get("llm_report", {}).get("contradiction_type", ""),
            
            status=TaskStatus.OPEN
        )
        
        session.add(task)
        await session.commit()
        await session.refresh(task)
        
        return task.id

async def create_tasks_from_anli_json(anli_results: List[dict]) -> List[str]:
    """Create multiple tasks from a list of ANLI results.
    
    Args:
        anli_results: List of ANLI result dictionaries
        
    Returns:
        List of created task IDs
    """
    task_ids = []
    for result in anli_results:
        task_id = await create_task_from_anli_result(result)
        task_ids.append(task_id)
    
    return task_ids

async def load_tasks_from_json_file(file_path: str) -> List[str]:
    """Load tasks from an ANLI JSON file.
    
    Args:
        file_path: Path to the JSON file containing ANLI results
        
    Returns:
        List of created task IDs
    """
    import json
    
    with open(file_path, 'r', encoding='utf-8') as f:
        anli_results = json.load(f)
    
    return await create_tasks_from_anli_json(anli_results)