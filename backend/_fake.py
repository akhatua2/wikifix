from sqlalchemy.orm import Session
from faker import Faker
import uuid
from datetime import datetime, UTC
from db.tasks_ops import Task, TaskStatus, Base
from sqlalchemy import create_engine
import json

# Setup
engine = create_engine("sqlite:///db/app.db")
Base.metadata.create_all(engine)
fake = Faker()

# Insert synthetic data
def populate_tasks(n=10):
    with Session(engine) as session:
        for _ in range(n):
            # Generate a random Wikipedia URL
            wiki_url = f"https://en.wikipedia.org/wiki/{fake.word().capitalize()}"
            
            task = Task(
                id=str(uuid.uuid4()),
                claim=fake.sentence(),
                claim_text_span=fake.text(max_nb_chars=50),
                claim_url=wiki_url,
                context=fake.text(max_nb_chars=200),
                report=fake.text(max_nb_chars=300),
                report_urls=json.dumps([wiki_url]),  # Store as JSON string
                status=TaskStatus.OPEN,
                completed_by=None,  # Not completed initially
                user_agrees=None,   # No user response yet
                user_analysis=None, # No analysis yet
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            session.add(task)
        session.commit()

populate_tasks(20)  # populate 20 synthetic task entries