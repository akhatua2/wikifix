#!/usr/bin/env python3
"""
Script to download Wikipedia pages locally using wget for offline serving.
"""

import asyncio
import subprocess
import os
import re
from urllib.parse import urlparse
from pathlib import Path
from typing import Set, List
from db.db import AsyncSessionLocal
from db.tasks_ops import Task
from sqlalchemy import select

# Directory where saved sites will be stored
SAVED_SITE_DIR = Path("saved_site")

def extract_wikipedia_page_from_url(url: str) -> str:
    """
    Extract the Wikipedia page name from a URL.
    Example: 'https://en.wikipedia.org/wiki/CRISPR' -> 'CRISPR'
    """
    if not url or not isinstance(url, str):
        return ""
    
    # Handle URLs with fragments or query parameters
    url = url.split('#')[0].split('?')[0]
    
    # Extract page name from Wikipedia URL
    match = re.match(r'https?://en\.wikipedia\.org/wiki/(.+)', url)
    if match:
        return match.group(1)
    return ""

def wikipedia_url_to_local_path(url: str) -> str:
    """
    Convert a Wikipedia URL to a local file path.
    Example: 'https://en.wikipedia.org/wiki/CRISPR' -> 'saved_site/en.wikipedia.org/wiki/CRISPR.html'
    """
    page_name = extract_wikipedia_page_from_url(url)
    if not page_name:
        return ""
    
    return str(SAVED_SITE_DIR / "en.wikipedia.org" / "wiki" / f"{page_name}.html")

def local_path_exists(url: str) -> bool:
    """Check if a local copy of the Wikipedia page exists."""
    local_path = wikipedia_url_to_local_path(url)
    if not local_path:
        return False
    return Path(local_path).exists()

async def get_all_wikipedia_urls() -> Set[str]:
    """Get all unique Wikipedia URLs from the database."""
    urls = set()
    
    async with AsyncSessionLocal() as session:
        # Get all tasks
        result = await session.execute(select(Task))
        tasks = result.scalars().all()
        
        for task in tasks:
            # Add claim URLs
            if task.claim_url and 'wikipedia.org' in task.claim_url:
                urls.add(task.claim_url)
            
            # Add evidence URLs
            if task.evidence_url and 'wikipedia.org' in task.evidence_url:
                urls.add(task.evidence_url)
    
    return urls

def download_wikipedia_page(url: str) -> bool:
    """
    Download a single Wikipedia page using wget.
    Returns True if successful, False otherwise.
    """
    try:
        page_name = extract_wikipedia_page_from_url(url)
        if not page_name:
            print(f"Could not extract page name from URL: {url}")
            return False
        
        # Check if already exists
        if local_path_exists(url):
            print(f"Page already exists locally: {page_name}")
            return True
        
        # Create directory if it doesn't exist
        SAVED_SITE_DIR.mkdir(exist_ok=True)
        
        print(f"Downloading Wikipedia page: {page_name}")
        
        # Use wget to download the page
        # --mirror: download the entire site
        # --convert-links: convert links to work locally
        # --adjust-extension: add .html extension if needed
        # --page-requisites: download all files needed to display the page (CSS, images, etc.)
        # --no-parent: don't ascend to parent directory
        # -P: specify directory prefix
        cmd = [
            'wget',
            '--mirror',
            '--convert-links',
            '--adjust-extension',
            '--page-requisites',
            '--no-parent',
            '-P', str(SAVED_SITE_DIR),
            url
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print(f"Successfully downloaded: {page_name}")
            return True
        else:
            print(f"Failed to download {page_name}: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"Timeout downloading: {url}")
        return False
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

async def download_all_wikipedia_pages():
    """Download all Wikipedia pages referenced in the database."""
    urls = await get_all_wikipedia_urls()
    
    if not urls:
        print("No Wikipedia URLs found in database")
        return
    
    print(f"Found {len(urls)} unique Wikipedia URLs")
    
    success_count = 0
    failure_count = 0
    
    for url in urls:
        if download_wikipedia_page(url):
            success_count += 1
        else:
            failure_count += 1
    
    print(f"\nDownload complete:")
    print(f"  Successful: {success_count}")
    print(f"  Failed: {failure_count}")
    print(f"  Total: {len(urls)}")

def download_single_page(url: str):
    """Download a single Wikipedia page."""
    if not url:
        print("No URL provided")
        return
    
    if 'wikipedia.org' not in url:
        print("Not a Wikipedia URL")
        return
    
    success = download_wikipedia_page(url)
    if success:
        print(f"Successfully downloaded: {url}")
    else:
        print(f"Failed to download: {url}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Download single page
        download_single_page(sys.argv[1])
    else:
        # Download all pages from database
        asyncio.run(download_all_wikipedia_pages()) 