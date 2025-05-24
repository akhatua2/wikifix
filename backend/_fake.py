from sqlalchemy.orm import Session
from faker import Faker
import uuid
from datetime import datetime
from db.tasks_ops import Task, TaskStatus, Base
from sqlalchemy import create_engine

# Setup
engine = create_engine("sqlite:///db/app.db")
Base.metadata.create_all(engine)
fake = Faker()

# Insert synthetic data
def populate_tasks(n=10):
    with Session(engine) as session:
        for _ in range(n):
            task = Task(
                id=str(uuid.uuid4()),
                text=fake.sentence(),
                context=fake.text(max_nb_chars=200),
                status=TaskStatus.OPEN,
                completed_by=None,  # Not completed initially
                user_agrees=None,   # No user response yet
                user_analysis=None, # No analysis yet
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(task)
        session.commit()

populate_tasks(20)  # populate 20 synthetic task entries