"""
Main preprocessing pipeline for WikiFix.
This module handles the complete workflow from ANLI JSON to database with highlighted HTML.
"""

import json
import asyncio
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from urllib.parse import urlparse
import re

# Import our highlighting module
from .highlighting import add_highlight_to_html

# Import from utils and db using absolute paths
import sys
from pathlib import Path
# Add the backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from utils.url_mapping import extract_wikipedia_page_from_url, local_file_exists, local_url_to_file_path
from db.tasks_ops import Task, TaskStatus, AsyncSessionLocal
from db.db import Base, engine


class PreprocessingPipeline:
    """Main preprocessing pipeline class."""
    
    def __init__(self, saved_site_dir: str = "saved_site"):
        self.saved_site_dir = Path(saved_site_dir)
        self.processed_count = 0
        self.failed_count = 0
        self.skipped_count = 0
    
    def extract_page_name_from_url(self, url: str) -> Optional[str]:
        """Extract Wikipedia page name from URL."""
        return extract_wikipedia_page_from_url(url)
    
    def get_local_html_content(self, page_name: str) -> Optional[str]:
        """Read the local HTML content for a Wikipedia page."""
        if not page_name:
            return None
            
        try:
            file_path = local_url_to_file_path(page_name)
            if not file_path.exists():
                print(f"Local file not found: {file_path}")
                return None
                
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading local file for {page_name}: {e}")
            return None
    
    def process_claim_highlighting(self, anli_result: Dict) -> Optional[str]:
        """Process claim highlighting and return highlighted HTML."""
        claim_url = anli_result.get("document_url", "")
        claim_text_span = anli_result.get("claim_text_span", "")
        claim_context = anli_result.get("claim_context", "")
        
        if not claim_url or not claim_text_span:
            print(f"Missing claim URL or text span")
            return None
        
        # Extract page name from URL
        page_name = self.extract_page_name_from_url(claim_url)
        if not page_name:
            print(f"Could not extract page name from claim URL: {claim_url}")
            return None
        
        # Check if local file exists
        if not local_file_exists(page_name):
            print(f"Local file does not exist for claim page: {page_name}")
            return None
        
        # Read local HTML content
        html_content = self.get_local_html_content(page_name)
        if not html_content:
            return None
        
        # Apply highlighting
        try:
            highlighted_html = add_highlight_to_html(
                html_content=html_content,
                text_to_highlight=claim_text_span,
                context_text=claim_context,
                page_name=page_name
            )
            print(f"Successfully processed claim highlighting for: {page_name}")
            return highlighted_html
        except Exception as e:
            print(f"Error processing claim highlighting for {page_name}: {e}")
            return None
    
    def process_evidence_highlighting(self, anli_result: Dict) -> Optional[str]:
        """Process evidence highlighting and return highlighted HTML."""
        evidence_url = anli_result.get("evidence_url", "")
        evidence_sentence = anli_result.get("evidence_sentence", "")
        evidence_context = anli_result.get("evidence", "")  # Full evidence content
        
        if not evidence_url or not evidence_sentence:
            print(f"Missing evidence URL or sentence")
            return None
        
        # Extract page name from URL
        page_name = self.extract_page_name_from_url(evidence_url)
        if not page_name:
            print(f"Could not extract page name from evidence URL: {evidence_url}")
            return None
        
        # Check if local file exists
        if not local_file_exists(page_name):
            print(f"Local file does not exist for evidence page: {page_name}")
            return None
        
        # Read local HTML content
        html_content = self.get_local_html_content(page_name)
        if not html_content:
            return None
        
        # Apply highlighting
        try:
            highlighted_html = add_highlight_to_html(
                html_content=html_content,
                text_to_highlight=evidence_sentence,
                context_text=evidence_context,
                page_name=page_name
            )
            print(f"Successfully processed evidence highlighting for: {page_name}")
            return highlighted_html
        except Exception as e:
            print(f"Error processing evidence highlighting for {page_name}: {e}")
            return None
    
    async def create_task_with_highlighting(self, anli_result: Dict) -> Optional[str]:
        """Create a task with pre-processed highlighting."""
        try:
            # Process claim highlighting
            print(f"\n=== Processing Claim ===")
            claim_highlighted_html = self.process_claim_highlighting(anli_result)
            
            # Process evidence highlighting
            print(f"=== Processing Evidence ===")
            evidence_highlighted_html = self.process_evidence_highlighting(anli_result)
            
            # Create task in database
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
                    evidence_text_span=anli_result.get("evidence_sentence", ""),
                    evidence_url=anli_result.get("evidence_url", ""),
                    
                    # Pre-processed highlighted HTML
                    claim_highlighted_html=claim_highlighted_html,
                    evidence_highlighted_html=evidence_highlighted_html,
                    
                    # LLM analysis
                    llm_analysis=anli_result.get("llm_report", {}).get("analysis", ""),
                    contradiction_type=anli_result.get("llm_report", {}).get("contradiction_type", ""),
                    
                    status=TaskStatus.OPEN
                )
                
                session.add(task)
                await session.commit()
                await session.refresh(task)
                
                self.processed_count += 1
                print(f"✅ Created task {task.id} with highlighting")
                return task.id
                
        except Exception as e:
            print(f"❌ Error creating task: {e}")
            self.failed_count += 1
            return None
    
    async def process_anli_json_file(self, json_file_path: str, limit: Optional[int] = None) -> Dict[str, int]:
        """Process an ANLI JSON file and create tasks with highlighting."""
        json_path = Path(json_file_path)
        
        if not json_path.exists():
            raise FileNotFoundError(f"ANLI JSON file not found: {json_file_path}")
        
        print(f"📂 Reading ANLI JSON file: {json_path}")
        
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                anli_data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in file {json_file_path}: {e}")
        
        total_items = len(anli_data)
        items_to_process = anli_data[:limit] if limit else anli_data
        
        print(f"📊 Found {total_items} ANLI results")
        print(f"🎯 Processing {len(items_to_process)} items")
        
        # Reset counters
        self.processed_count = 0
        self.failed_count = 0
        self.skipped_count = 0
        
        for i, anli_result in enumerate(items_to_process, 1):
            print(f"\n{'='*60}")
            print(f"📝 Processing item {i}/{len(items_to_process)}")
            print(f"Claim: {anli_result.get('claim', 'N/A')[:100]}...")
            
            # Check if both URLs have local files
            claim_page = self.extract_page_name_from_url(anli_result.get("document_url", ""))
            evidence_page = self.extract_page_name_from_url(anli_result.get("evidence_url", ""))
            
            if not claim_page or not evidence_page:
                print(f"⏭️  Skipping: Could not extract page names")
                self.skipped_count += 1
                continue
            
            if not local_file_exists(claim_page) or not local_file_exists(evidence_page):
                print(f"⏭️  Skipping: Local files missing for {claim_page} or {evidence_page}")
                self.skipped_count += 1
                continue
            
            # Create task with highlighting
            task_id = await self.create_task_with_highlighting(anli_result)
            
            if not task_id:
                print(f"❌ Failed to create task")
            
            # Progress update every 10 items
            if i % 10 == 0:
                print(f"\n📈 Progress: {i}/{len(items_to_process)} processed")
                print(f"   ✅ Successful: {self.processed_count}")
                print(f"   ❌ Failed: {self.failed_count}")
                print(f"   ⏭️  Skipped: {self.skipped_count}")
        
        print(f"\n{'='*60}")
        print(f"🎉 Processing Complete!")
        print(f"   ✅ Successfully processed: {self.processed_count}")
        print(f"   ❌ Failed: {self.failed_count}")
        print(f"   ⏭️  Skipped: {self.skipped_count}")
        print(f"   📊 Total attempted: {len(items_to_process)}")
        
        return {
            "processed": self.processed_count,
            "failed": self.failed_count,
            "skipped": self.skipped_count,
            "total": len(items_to_process)
        }

    async def recreate_tasks_table(self):
        """Drop and recreate the tasks table with the new schema."""
        from sqlalchemy import text
        
        print("🗑️  Dropping existing tasks table...")
        async with engine.begin() as conn:
            await conn.execute(text("DROP TABLE IF EXISTS tasks"))
        
        print("🏗️  Creating tasks table with new schema...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Tasks table recreated successfully")


async def run_preprocessing_pipeline(
    anli_json_path: str,
    recreate_table: bool = True,
    limit: Optional[int] = None
) -> Dict[str, int]:
    """
    Main entry point for the preprocessing pipeline.
    
    Args:
        anli_json_path: Path to the ANLI JSON file
        recreate_table: Whether to recreate the tasks table
        limit: Limit the number of items to process (for testing)
    
    Returns:
        Dictionary with processing statistics
    """
    pipeline = PreprocessingPipeline()
    
    if recreate_table:
        await pipeline.recreate_tasks_table()
    
    return await pipeline.process_anli_json_file(anli_json_path, limit)


if __name__ == "__main__":
    # Example usage
    anli_json_path = "/data1/akhatua/wiki_llm/anli_results.json"
    
    # Run with a small limit for testing
    asyncio.run(run_preprocessing_pipeline(
        anli_json_path=anli_json_path,
        recreate_table=True,
        limit=5  # Process only 5 items for testing
    )) 