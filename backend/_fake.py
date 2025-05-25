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

def clear_tasks():
    with Session(engine) as session:
        session.query(Task).delete()
        session.commit()

def populate_tasks_from_json():
    # Read the JSON file
    with open('inconsistent_claims.json', 'r') as f:
        claims_data = json.load(f)
    
    with Session(engine) as session:
        for claim_data in claims_data:
            task = Task(
                id=str(uuid.uuid4()),
                claim=claim_data['claim'],
                claim_text_span=claim_data['claim_text_span'],
                claim_url=claim_data['claim_url'],
                context=claim_data['context'],
                report=claim_data['report'],
                report_urls=claim_data['report_urls'],
                status=TaskStatus.OPEN,
                completed_by=None,
                user_agrees=None,
                user_analysis=None,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            session.add(task)
        session.commit()

# Clear existing tasks and populate with real data
clear_tasks()
populate_tasks_from_json()