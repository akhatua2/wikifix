"""
FastAPI router for serving local Wikipedia files.
Updated to serve pre-processed highlighted content from database.
"""

from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import FileResponse, HTMLResponse
import os
import mimetypes
from pathlib import Path
import re
from typing import Optional

from utils.url_mapping import (
    local_url_to_file_path, 
    local_file_exists, 
    extract_wikipedia_page_from_url
)
from db.tasks_ops import Task, get_task, AsyncSessionLocal
from sqlalchemy import select

router = APIRouter()

# Base directory for saved Wikipedia files
SAVED_SITE_DIR = Path("saved_site")

def fix_html_content_basic(content: str, page_name: str) -> str:
    """
    Basic HTML content fixing for local serving (without highlighting processing).
    """
    # Convert relative Wikipedia links to use our local API
    content = re.sub(
        r'href="(/wiki/[^"]+)"(?![^<]*</a>[^<]*href="/api/wiki/)',
        r'href="/api\1"',
        content
    )
    
    # Fix internal links (same page anchors)
    content = re.sub(
        r'href="(#[^"]+)"(?![^<]*</a>[^<]*href="/api/wiki/)',
        rf'href="/api/wiki/{page_name}\1"',
        content
    )
    
    # Fix CSS and JS links
    content = re.sub(
        r'href="(/w/[^"]*\.css[^"]*)"',
        r'href="/api/wiki-static\1"',
        content
    )
    
    content = re.sub(
        r'src="(/w/[^"]*\.js[^"]*)"',
        r'src="/api/wiki-static\1"',
        content
    )
    
    # Fix image sources
    content = re.sub(
        r'src="(/w/[^"]*\.(png|jpg|jpeg|gif|svg|webp)[^"]*)"',
        r'src="/api/wiki-static\1"',
        content
    )
    
    content = re.sub(
        r'src="(//upload\.wikimedia\.org/[^"]*)"',
        r'src="https:\1"',
        content
    )
    
    content = re.sub(
        r'src="(/static/[^"]*)"',
        r'src="/api/wiki-static\1"',
        content
    )
    
    return content

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
    Serve a local Wikipedia page WITHOUT highlighting (for non-task pages).
    This is now a simple file serving endpoint.
    """
    try:
        # Security check
        if ".." in page_name or page_name.startswith("/"):
            raise HTTPException(status_code=400, detail="Invalid page name")
        
        # Check if local file exists
        if not local_file_exists(page_name):
            raise HTTPException(
                status_code=404, 
                detail=f"Wikipedia page '{page_name}' not found locally."
            )
        
        file_path = local_url_to_file_path(page_name)
        
        # Read and fix the HTML content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply basic fixes for local serving
        fixed_content = fix_html_content_basic(content, page_name)
        
        return HTMLResponse(content=fixed_content)
        
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

@router.get("/download/{url:path}")
async def download_wikipedia_page(url: str):
    """
    Download a Wikipedia page on-demand if it doesn't exist locally.
    """
    try:
        # Import here to avoid circular imports
        from download_wikipedia import download_wikipedia_page
        
        # Decode URL
        import urllib.parse
        decoded_url = urllib.parse.unquote(url)
        
        # Validate it's a Wikipedia URL
        if 'wikipedia.org' not in decoded_url:
            raise HTTPException(status_code=400, detail="Not a Wikipedia URL")
        
        # Try to download
        success = download_wikipedia_page(decoded_url)
        
        if success:
            page_name = extract_wikipedia_page_from_url(decoded_url)
            return {
                "success": True, 
                "message": f"Successfully downloaded {page_name}",
                "local_url": f"/api/wiki/{page_name}"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to download page")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading page: {str(e)}")

@router.get("/status/{page_name}")
async def check_page_status(page_name: str):
    """
    Check if a Wikipedia page is available locally.
    """
    try:
        exists = local_file_exists(page_name)
        return {
            "page_name": page_name,
            "exists_locally": exists,
            "local_url": f"/api/wiki/{page_name}" if exists else None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking page status: {str(e)}")
