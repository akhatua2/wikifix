import asyncio
import uuid
from datetime import datetime, timezone
from db.tasks_ops import Task, TaskStatus, create_task_from_anli_result
from db.db import engine, Base
from sqlalchemy import create_engine as sync_create_engine, text
from sqlalchemy.orm import Session
import json

# Setup - use sync engine for this script
sync_engine = sync_create_engine("sqlite:///db/app.db")

def recreate_tasks_table():
    """Drop and recreate the tasks table with the new schema."""
    with sync_engine.connect() as conn:
        # Drop the existing tasks table if it exists
        conn.execute(text("DROP TABLE IF EXISTS tasks"))
        conn.commit()
        print("Dropped existing tasks table")
        
    # Create all tables with the new schema
    Base.metadata.create_all(sync_engine)
    print("Created tasks table with new schema")

def clear_tasks():
    """Clear all existing tasks from the database."""
    with Session(sync_engine) as session:
        session.query(Task).delete()
        session.commit()
        print("Cleared all existing tasks")

async def populate_tasks_from_anli_json():
    """Populate tasks from the ANLI results JSON file."""
    # Read the ANLI JSON file
    json_path = '/data1/akhatua/wiki_llm/anli_results.json'
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            anli_data = json.load(f)
    except FileNotFoundError:
        print(f"Could not find file: {json_path}")
        return
    except json.JSONDecodeError:
        print(f"Invalid JSON in file: {json_path}")
        return
    
    print(f"Found {len(anli_data)} ANLI results to process")
    
    # Create tasks using the async function
    task_ids = []
    for i, anli_result in enumerate(anli_data):
        try:
            task_id = await create_task_from_anli_result(anli_result)
            task_ids.append(task_id)
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1}/{len(anli_data)} tasks")
        except Exception as e:
            print(f"Error creating task {i + 1}: {e}")
            continue
    
    print(f"Successfully created {len(task_ids)} tasks")
    return task_ids

async def main():
    """Main function to recreate table and populate tasks."""
    print("=== Updating Tasks Database ===")
    
    # Recreate the tasks table with new schema
    recreate_tasks_table()
    
    # Populate with ANLI data
    await populate_tasks_from_anli_json()
    
    print("=== Database update complete ===")

if __name__ == "__main__":
    # Run the async main function
    asyncio.run(main())