"""
Ultra-simple FastAPI router for serving Wikipedia content.
Uses the consolidated wikipedia_processor.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
import mimetypes
from pathlib import Path

from db.tasks_ops import Task, AsyncSessionLocal
from preprocessing.wikipedia_processor import get_local_html_content

router = APIRouter()

# Base directory for saved Wikipedia files  
SAVED_SITE_DIR = Path("saved_site")

@router.get("/wiki-highlighted/claim/{task_id}")
async def serve_claim_highlighted_content(task_id: str):
    """
    Serve pre-processed highlighted HTML content for a task's claim.
    """
    try:
        # Get task from database
        async with AsyncSessionLocal() as session:
            task = await session.get(Task, task_id)
            
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        if not task.claim_highlighted_html:
            raise HTTPException(
                status_code=404, 
                detail=f"No highlighted content available for claim in task {task_id}"
            )
        
        return HTMLResponse(content=task.claim_highlighted_html)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving claim content: {str(e)}")

@router.get("/wiki-highlighted/evidence/{task_id}")
async def serve_evidence_highlighted_content(task_id: str):
    """
    Serve pre-processed highlighted HTML content for a task's evidence.
    """
    try:
        # Get task from database
        async with AsyncSessionLocal() as session:
            task = await session.get(Task, task_id)
            
        if not task:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        
        if not task.evidence_highlighted_html:
            raise HTTPException(
                status_code=404, 
                detail=f"No highlighted content available for evidence in task {task_id}"
            )
        
        return HTMLResponse(content=task.evidence_highlighted_html)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving evidence content: {str(e)}")

@router.get("/wiki/{page_name:path}")
async def serve_wikipedia_page(page_name: str):
    """
    Serve a local Wikipedia page WITHOUT highlighting (for general browsing).
    """
    try:
        # Security check
        if ".." in page_name or page_name.startswith("/"):
            raise HTTPException(status_code=400, detail="Invalid page name")
        
        # Get content using consolidated processor
        content = get_local_html_content(page_name)
        if not content:
            raise HTTPException(
                status_code=404, 
                detail=f"Wikipedia page '{page_name}' not found locally."
            )
        
        return HTMLResponse(content=content)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving page: {str(e)}")

@router.get("/wiki-static/{file_path:path}")
async def serve_static_file(file_path: str):
    """
    Serve static files (CSS, JS, images) for Wikipedia pages.
    """
    try:
        # Security check
        if ".." in file_path:
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Construct full file path
        full_path = SAVED_SITE_DIR / "en.wikipedia.org" / file_path.lstrip("/")
        
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="Static file not found")
        
        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(str(full_path))
        if mime_type is None:
            mime_type = "application/octet-stream"
        
        return FileResponse(
            path=str(full_path),
            media_type=mime_type
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving static file: {str(e)}")

# Removed complex on-demand download and status endpoints
# All Wikipedia pages are now pre-processed via run_processor.py
