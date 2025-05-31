"""
URL mapping utilities for converting Wikipedia URLs to local served URLs.
"""

import re
import os
import urllib.parse
from pathlib import Path
from typing import Optional

# Base URL for local Wikipedia serving
LOCAL_WIKIPEDIA_BASE = "/api/wiki"
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

def wikipedia_url_exists_locally(url: str) -> bool:
    """
    Check if a Wikipedia URL exists as a local file.
    """
    page_name = extract_wikipedia_page_from_url(url)
    if not page_name:
        return False
    
    return local_file_exists(page_name)

def local_file_exists(page_name: str) -> bool:
    """
    Check if a local Wikipedia file exists.
    """
    if not page_name:
        return False
    
    file_path = local_url_to_file_path(page_name)
    return file_path.exists()

def local_url_to_file_path(page_name: str) -> Path:
    """
    Convert a Wikipedia page name to the local file path.
    """
    # Handle URL encoding
    page_name = urllib.parse.unquote(page_name)
    
    # Construct the file path
    file_path = SAVED_SITE_DIR / "en.wikipedia.org" / "wiki" / f"{page_name}.html"
    return file_path

def convert_url_if_local_exists(url: str, text_span: Optional[str] = None, context_text: Optional[str] = None) -> str:
    """
    Convert a Wikipedia URL to a local URL if the file exists locally.
    Optionally include text span and context for highlighting.
    """
    if not url or not isinstance(url, str):
        return url
    
    # Check if it's already a local URL
    if url.startswith(LOCAL_WIKIPEDIA_BASE):
        # If text_span or context is provided, add them as query parameters
        if text_span or context_text:
            return add_highlight_and_context_parameters(url, text_span, context_text)
        return url
    
    # Check if it's a Wikipedia URL and exists locally
    if wikipedia_url_exists_locally(url):
        page_name = extract_wikipedia_page_from_url(url)
        local_url = f"{LOCAL_WIKIPEDIA_BASE}/{page_name}"
        
        # Add highlighting and context if provided
        if text_span or context_text:
            local_url = add_highlight_and_context_parameters(local_url, text_span, context_text)
        
        return local_url
    
    # Return original URL if not available locally
    return url

def add_highlight_and_context_parameters(local_url: str, text_span: str = None, context_text: str = None) -> str:
    """
    Add highlight and context parameters to a local Wikipedia URL.
    """
    if not text_span and not context_text:
        return local_url
    
    params = []
    
    if text_span:
        encoded_text = urllib.parse.quote(text_span)
        params.append(f"highlight={encoded_text}")
    
    if context_text:
        encoded_context = urllib.parse.quote(context_text)
        params.append(f"context={encoded_context}")
    
    if params:
        separator = "&" if "?" in local_url else "?"
        return f"{local_url}{separator}{'&'.join(params)}"
    
    return local_url

def add_fragment_to_local_url(local_url: str, original_url: str) -> str:
    """
    Preserve any fragment from the original URL to the local URL.
    """
    if '#' in original_url:
        fragment = original_url.split('#')[1]
        if fragment and '#' not in local_url:
            return f"{local_url}#{fragment}"
    return local_url

def convert_task_url_with_text_span(url: str, text_span: str, context_text: str = None) -> str:
    """
    Convert a task URL to local with text span highlighting and optional context.
    This is the main function to use for task URLs.
    """
    if not url:
        return url
    
    # First convert to local if available
    local_url = convert_url_if_local_exists(url, text_span, context_text)
    
    # Preserve any existing fragments
    local_url = add_fragment_to_local_url(local_url, url)
    
    return local_url 