"""
FastAPI router for serving local Wikipedia files.
"""

from fastapi import APIRouter, HTTPException, Response, Query
from fastapi.responses import FileResponse, HTMLResponse
import os
import mimetypes
from pathlib import Path
import re
from typing import Optional
import html
from difflib import SequenceMatcher
from bs4 import BeautifulSoup, NavigableString, Tag

from utils.url_mapping import (
    local_url_to_file_path, 
    local_file_exists, 
    extract_wikipedia_page_from_url
)

router = APIRouter()

# Base directory for saved Wikipedia files
SAVED_SITE_DIR = Path("saved_site")

def normalize_text_for_matching(text: str) -> str:
    """
    Normalize text for better fuzzy matching by removing punctuation, citations, and spaces.
    Enhanced to handle Wikipedia's complex citation structure with <sup> tags and HTML entities.
    """
    if not text:
        return ""
    
    # Convert to lowercase
    normalized = text.lower()
    
    # Remove Wikipedia's complex citation structure: <sup>...</sup>
    # This handles citations like: <sup class="reference" id="cite_ref-..."><a href="..."><span class="cite-bracket">[</span>5<span class="cite-bracket">]</span></a></sup>
    normalized = re.sub(r'<sup[^>]*>.*?</sup>', '', normalized, flags=re.DOTALL)
    
    # Remove simple bracket citations like [1], [citation needed], etc.
    normalized = re.sub(r'\[[^\]]*\]', '', normalized)
    
    # Remove other HTML tags
    normalized = re.sub(r'<[^>]+>', '', normalized)
    
    # Decode HTML entities (like &#160; for non-breaking space, &#8211; for en-dash, etc.)
    normalized = html.unescape(normalized)
    
    # Replace various types of spaces and dashes with standard ones
    # Non-breaking space, thin space, em space, en space -> regular space
    normalized = re.sub(r'[\u00A0\u2009\u2003\u2002\u2000\u2001\u2004\u2005\u2006\u2007\u2008\u200A\u200B\u202F\u205F\u3000]', ' ', normalized)
    
    # Replace various types of dashes and minus signs with regular hyphen
    # En dash, em dash, minus sign, hyphen-minus -> regular hyphen
    normalized = re.sub(r'[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u002D]', '-', normalized)
    
    # Replace various types of quotes with standard ones
    normalized = re.sub(r'[\u2018\u2019\u201A\u201B\u2032\u2035]', "'", normalized)  # Single quotes
    normalized = re.sub(r'[\u201C\u201D\u201E\u201F\u2033\u2036]', '"', normalized)  # Double quotes
    
    # Remove all punctuation except spaces (temporarily)
    normalized = re.sub(r'[^\w\s]', '', normalized)
    
    # Remove extra whitespace and normalize spaces
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    # Remove all spaces for final comparison
    normalized = normalized.replace(' ', '')
    
    return normalized

def find_best_text_match(html_content: str, target_text: str, context_text: str = None) -> Optional[dict]:
    """
    Find the best matching text in HTML content using improved fuzzy matching.
    Returns dict with 'text' and 'type' ('exact', 'fuzzy', 'context', 'keyword', 'paragraph').
    """
    if not target_text or not html_content:
        return None
    
    # Remove HTML tags for text search
    text_content = re.sub(r'<[^>]+>', ' ', html_content)
    text_content = re.sub(r'\s+', ' ', text_content).strip()
    
    # Clean target text
    clean_target = re.sub(r'\s+', ' ', target_text.strip())
    
    # Try exact match first (case insensitive)
    if clean_target.lower() in text_content.lower():
        escaped_target = re.escape(clean_target)
        pattern = escaped_target.replace(r'\ ', r'\s+')
        match = re.search(pattern, text_content, re.IGNORECASE)
        if match:
            return {'text': match.group(), 'type': 'exact'}
    
    # Normalize texts for fuzzy matching
    normalized_target = normalize_text_for_matching(clean_target)
    
    # Try sentence-by-sentence matching for longer text
    if len(clean_target) > 30:
        sentences = [s.strip() for s in clean_target.split('.') if len(s.strip()) > 10]
        for sentence in sentences:
            normalized_sentence = normalize_text_for_matching(sentence)
            if len(normalized_sentence) > 10:
                # Try to find this sentence in the content
                words = sentence.split()
                if len(words) >= 3:
                    # Create a flexible pattern for this sentence
                    pattern_words = [re.escape(word) for word in words]
                    pattern = r'\b' + r'\s+'.join(pattern_words) + r'\b'
                    match = re.search(pattern, text_content, re.IGNORECASE)
                    if match:
                        return {'text': match.group(), 'type': 'sentence'}
    
    # Advanced fuzzy matching with normalization
    text_sentences = re.split(r'[.!?]+', text_content)
    
    best_match = None
    best_ratio = 0
    match_type = 'fuzzy'
    
    for sentence in text_sentences:
        if len(sentence.strip()) < 20:  # Skip very short sentences
            continue
            
        normalized_sentence = normalize_text_for_matching(sentence)
        
        if not normalized_sentence:
            continue
            
        # Calculate similarity
        ratio = SequenceMatcher(None, normalized_target, normalized_sentence).ratio()
        
        if ratio > best_ratio and ratio >= 0.75:  # Lower threshold for normalized matching
            best_ratio = ratio
            best_match = sentence.strip()
    
    if best_match:
        return {'text': best_match, 'type': match_type}
    
    # Try to match with context if provided
    if context_text and len(context_text) > 50:
        normalized_context = normalize_text_for_matching(context_text)
        
        for sentence in text_sentences:
            if len(sentence.strip()) < 30:
                continue
                
            normalized_sentence = normalize_text_for_matching(sentence)
            ratio = SequenceMatcher(None, normalized_context, normalized_sentence).ratio()
            
            if ratio > best_ratio and ratio >= 0.6:  # Even lower threshold for context
                best_ratio = ratio
                best_match = sentence.strip()
                match_type = 'context'
    
    if best_match:
        return {'text': best_match, 'type': match_type}
    
    # Last resort: keyword matching with distinctive words
    keywords = [word for word in clean_target.split() 
                if len(word) > 4 and word.lower() not in ['this', 'that', 'with', 'from', 'they', 'them', 'were', 'been', 'have', 'will', 'would', 'could', 'should']]
    
    if keywords:
        # Try to find sentences containing multiple keywords
        for sentence in text_sentences:
            if len(sentence.strip()) < 20:
                continue
                
            sentence_lower = sentence.lower()
            keyword_matches = sum(1 for keyword in keywords if keyword.lower() in sentence_lower)
            
            if keyword_matches >= min(2, len(keywords)):
                return {'text': sentence.strip(), 'type': 'keyword'}
    
    # PARAGRAPH FALLBACK: If nothing else works, find the most relevant paragraph
    return find_paragraph_fallback(html_content, target_text, keywords)

def find_paragraph_fallback(html_content: str, target_text: str, keywords: list) -> Optional[dict]:
    """
    Fallback method to find and highlight the most relevant paragraph when precise matching fails.
    """
    # Extract paragraphs from HTML content
    paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', html_content, re.DOTALL | re.IGNORECASE)
    
    if not paragraphs:
        # If no <p> tags, split by double newlines or <br> tags
        text_content = re.sub(r'<[^>]+>', ' ', html_content)
        paragraphs = [p.strip() for p in re.split(r'\n\n|\r\n\r\n|<br\s*/?>\s*<br\s*/?>', text_content) if len(p.strip()) > 50]
    
    if not paragraphs:
        return None
    
    # Score each paragraph based on keyword matches and text similarity
    best_paragraph = None
    best_score = 0
    
    for paragraph in paragraphs:
        # Remove HTML tags from paragraph
        clean_paragraph = re.sub(r'<[^>]+>', ' ', paragraph)
        clean_paragraph = re.sub(r'\s+', ' ', clean_paragraph).strip()
        
        if len(clean_paragraph) < 50:  # Skip very short paragraphs
            continue
        
        score = 0
        
        # Score based on keyword matches
        if keywords:
            paragraph_lower = clean_paragraph.lower()
            keyword_matches = sum(1 for keyword in keywords if keyword.lower() in paragraph_lower)
            score += keyword_matches * 10  # Weight keyword matches heavily
        
        # Score based on text similarity
        normalized_target = normalize_text_for_matching(target_text)
        normalized_paragraph = normalize_text_for_matching(clean_paragraph)
        
        if normalized_target and normalized_paragraph:
            similarity = SequenceMatcher(None, normalized_target, normalized_paragraph).ratio()
            score += similarity * 5  # Weight similarity moderately
        
        # Score based on length (prefer longer, more detailed paragraphs)
        score += min(len(clean_paragraph) / 1000, 2)  # Cap length bonus at 2 points
        
        if score > best_score:
            best_score = score
            best_paragraph = paragraph
    
    if best_paragraph and best_score > 1:  # Minimum threshold for paragraph matching
        # Return the HTML paragraph with tags intact for better highlighting
        return {'text': best_paragraph, 'type': 'paragraph'}
    
    return None

def add_highlight_javascript(html_content: str, text_to_highlight: str, context_text: str = None) -> str:
    """
    Add highlighting and auto-scroll functionality using the new HTML-aware highlighting.
    """
    if not text_to_highlight:
        return html_content
    
    # Find the best matching text
    actual_text_match = find_best_text_match(html_content, text_to_highlight, context_text)
    
    if actual_text_match:
        text_to_highlight = actual_text_match['text']
        match_type = actual_text_match['type']
        print(f"Found {match_type} match: {text_to_highlight[:100]}...")
        
        # Use the new HTML-aware highlighting function
        html_content = highlight_text_in_html(html_content, text_to_highlight, match_type)
    
    # Add CSS and auto-scroll JavaScript
    css_and_script = f"""
<style>
.wikifix-highlight-exact {{
    background-color: #ffff99 !important;
    padding: 1px 2px !important;
    border-radius: 2px !important;
    transition: all 0.3s ease !important;
}}

.wikifix-highlight-fuzzy {{
    background-color: #fff3cd !important;
    padding: 1px 2px !important;
    border-radius: 2px !important;
    border-left: 3px solid #ffc107 !important;
    transition: all 0.3s ease !important;
}}

.wikifix-highlight-keyword {{
    background-color: #f8f9fa !important;
    padding: 1px 2px !important;
    border-radius: 2px !important;
    border-left: 2px solid #6c757d !important;
    transition: all 0.3s ease !important;
}}

.wikifix-highlight-paragraph {{
    background-color: #f0f8ff !important;
    border: 2px solid #4a90e2 !important;
    border-radius: 8px !important;
    padding: 10px !important;
    margin: 5px 0 !important;
    box-shadow: 0 2px 8px rgba(74, 144, 226, 0.15) !important;
    transition: all 0.3s ease !important;
    display: block !important;
}}

.wikifix-highlight-exact:hover,
.wikifix-highlight-fuzzy:hover,
.wikifix-highlight-keyword:hover {{
    opacity: 0.8 !important;
}}

.wikifix-highlight-paragraph:hover {{
    box-shadow: 0 4px 16px rgba(74, 144, 226, 0.25) !important;
    border-color: #357abd !important;
}}

/* Auto-scroll animation */
[id^="highlighted-text-wikifix"],
[id^="highlighted-paragraph-"] {{
    animation: wikifix-subtle-pulse 1.5s ease-in-out 2;
    scroll-margin-top: 100px;
}}

@keyframes wikifix-subtle-pulse {{
    0%, 100% {{ transform: scale(1); opacity: 1; }}
    50% {{ transform: scale(1.01); opacity: 0.9; }}
}}
</style>
<script>
// Enhanced JavaScript for better cross-origin compatibility
(function() {{
    // Send ready message to parent window
    function sendReadyMessage() {{
        try {{
            if (window.parent && window.parent !== window) {{
                window.parent.postMessage('iframe-ready', '*');
                console.log('WikiFix: Sent ready message to parent');
            }}
        }} catch (e) {{
            console.log('WikiFix: Could not send ready message:', e);
        }}
    }}
    
    // Scroll to highlighted element after page loads
    function scrollToHighlight() {{
        // Try to find any highlighted element
        let highlighted = document.querySelector('[id^="highlighted-text-wikifix"]') || 
                         document.querySelector('[id^="highlighted-paragraph-"]') ||
                         document.querySelector('.wikifix-highlight-exact') ||
                         document.querySelector('.wikifix-highlight-fuzzy') ||
                         document.querySelector('.wikifix-highlight-keyword') ||
                         document.querySelector('.wikifix-highlight-paragraph');
        
        if (highlighted) {{
            setTimeout(function() {{
                highlighted.scrollIntoView({{
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                }});
                console.log('WikiFix: Scrolled to highlighted content');
            }}, 500);
        }} else {{
            console.log('WikiFix: No highlighted content found');
        }}
    }}
    
    // Run when page loads
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', function() {{
            scrollToHighlight();
            sendReadyMessage();
        }});
    }} else {{
        scrollToHighlight();
        sendReadyMessage();
    }}
}})();
</script>
"""
    
    # Insert CSS and script in the head
    if '<head>' in html_content:
        html_content = html_content.replace('<head>', f'<head>{css_and_script}', 1)
    elif '<html>' in html_content:
        html_content = html_content.replace('<html>', f'<html><head>{css_and_script}</head>', 1)
    else:
        html_content = css_and_script + html_content
    
    return html_content

def fix_html_content(content: str, page_name: str) -> str:
    """
    Fix HTML content to work properly when served locally.
    This includes fixing relative links and adjusting paths.
    """
    # Convert relative Wikipedia links to use our local API (only if not already converted)
    content = re.sub(
        r'href="(/wiki/[^"]+)"(?![^<]*</a>[^<]*href="/api/wiki/)',
        r'href="/api\1"',
        content
    )
    
    # Fix internal links (same page anchors) - be more specific
    content = re.sub(
        r'href="(#[^"]+)"(?![^<]*</a>[^<]*href="/api/wiki/)',
        rf'href="/api/wiki/{page_name}\1"',
        content
    )
    
    # Fix CSS and JS links to be absolute to the saved site (only if relative)
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
    
    # Fix image sources (more specific path matching for Wikipedia images)
    content = re.sub(
        r'src="(/w/[^"]*\.(png|jpg|jpeg|gif|svg|webp)[^"]*)"',
        r'src="/api/wiki-static\1"',
        content
    )
    
    # Also handle upload.wikimedia.org images 
    content = re.sub(
        r'src="(//upload\.wikimedia\.org/[^"]*)"',
        r'src="https:\1"',
        content
    )
    
    # Fix any remaining relative static paths
    content = re.sub(
        r'src="(/static/[^"]*)"',
        r'src="/api/wiki-static\1"',
        content
    )
    
    return content

def highlight_text_in_html(html_content: str, text_to_highlight: str, match_type: str = 'exact') -> str:
    """
    Highlight text in HTML content, even when the text spans across multiple HTML elements.
    This advanced version can handle text that crosses element boundaries like links.
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Create the highlight CSS class based on match type
        if match_type == 'exact':
            highlight_class = 'wikifix-highlight-exact'
        elif match_type in ['sentence', 'context']:
            highlight_class = 'wikifix-highlight-fuzzy'
        elif match_type == 'paragraph':
            highlight_class = 'wikifix-highlight-paragraph'
        else:
            highlight_class = 'wikifix-highlight-keyword'
        
        # If it's paragraph highlighting, find and highlight the entire paragraph
        if match_type == 'paragraph':
            paragraphs = soup.find_all('p')
            for p in paragraphs:
                p_text = p.get_text()
                if text_to_highlight.lower() in p_text.lower():
                    existing_class = p.get('class', [])
                    if isinstance(existing_class, str):
                        existing_class = [existing_class]
                    existing_class.append(highlight_class)
                    p['class'] = existing_class
                    p['id'] = f'highlighted-paragraph-{hash(text_to_highlight) % 10000}'
                    break
            return str(soup)
        
        # For cross-element text highlighting, use advanced approach
        def find_and_highlight_cross_element_text():
            """Find text that may span across multiple elements and highlight it."""
            # Find all text-containing elements (p, div, span, etc.)
            text_containers = soup.find_all(['p', 'div', 'span', 'td', 'th', 'li'])
            
            for container in text_containers:
                # Get the full text content of this container
                container_text = container.get_text()
                
                # Check if our target text is in this container
                if text_to_highlight.lower() in container_text.lower():
                    # Find the exact position in the text
                    start_pos = container_text.lower().find(text_to_highlight.lower())
                    if start_pos == -1:
                        continue
                    
                    end_pos = start_pos + len(text_to_highlight)
                    
                    # Now we need to find which text nodes contain this range
                    highlight_id = f'highlighted-text-wikifix-{hash(text_to_highlight) % 10000}'
                    
                    try:
                        # Use a different approach: wrap the entire text span with highlighting
                        return highlight_cross_element_text_advanced(container, text_to_highlight, highlight_class, highlight_id)
                    except Exception as e:
                        print(f"Advanced highlighting failed: {e}, falling back to simple")
                        continue
            
            return False
        
        def highlight_cross_element_text_advanced(container, target_text, css_class, highlight_id):
            """Advanced cross-element text highlighting using text node analysis."""
            # Get all text nodes and their positions
            container_html = str(container)
            container_text = container.get_text()
            
            # Find the target text position
            text_lower = container_text.lower()
            target_lower = target_text.lower()
            start_pos = text_lower.find(target_lower)
            
            if start_pos == -1:
                return False
                
            end_pos = start_pos + len(target_text)
            
            # Create a modified version that highlights the target span
            # We'll use a marker-based approach
            before_text = container_text[:start_pos]
            highlight_text = container_text[start_pos:end_pos]
            after_text = container_text[end_pos:]
            
            # Create markers that we can find in the HTML
            start_marker = f"🔸HIGHLIGHT_START_{highlight_id}🔸"
            end_marker = f"🔸HIGHLIGHT_END_{highlight_id}🔸"
            
            # Insert markers in the text
            marked_text = before_text + start_marker + highlight_text + end_marker + after_text
            
            # Now we need to apply these markers to the actual HTML structure
            # This is complex, so let's try a different approach
            
            # Simple but effective approach: replace the text in the HTML string directly
            # but only within this container
            original_container_str = str(container)
            
            # Find the actual text occurrence in the HTML (may be split across tags)
            # Use a regex that can handle text split across tags
            import re
            
            # Create a pattern that matches the text even if split by HTML tags
            # Escape special regex characters in the target text
            escaped_target = re.escape(target_text)
            # Allow HTML tags between characters
            flexible_pattern = escaped_target.replace(r'\ ', r'(?:\s|</[^>]*>|<[^>]*>)*')
            
            try:
                # Create the highlight span
                highlight_span = f'<span class="{css_class}" id="{highlight_id}">{target_text}</span>'
                
                # Replace the text, being careful about case sensitivity
                modified_html = re.sub(
                    flexible_pattern,
                    highlight_span,
                    original_container_str,
                    count=1,
                    flags=re.IGNORECASE | re.DOTALL
                )
                
                if modified_html != original_container_str:
                    # Parse the modified HTML and replace the original container
                    new_container = BeautifulSoup(modified_html, 'html.parser')
                    container.replace_with(new_container)
                    return True
                    
            except Exception as e:
                print(f"Regex replacement failed: {e}")
                
            return False
        
        # Try the advanced cross-element highlighting
        if find_and_highlight_cross_element_text():
            return str(soup)
        
        # Fallback: try simple text replacement
        # This should work for cases where text doesn't cross element boundaries
        def simple_text_highlighting():
            """Simple text highlighting for text within single elements."""
            # Find all text nodes and try to highlight
            for element in soup.find_all(text=True):
                if element.parent.name in ['script', 'style', 'title']:
                    continue
                    
                element_text = str(element)
                if text_to_highlight.lower() in element_text.lower():
                    start_pos = element_text.lower().find(text_to_highlight.lower())
                    if start_pos != -1:
                        before = element_text[:start_pos]
                        match = element_text[start_pos:start_pos + len(text_to_highlight)]
                        after = element_text[start_pos + len(text_to_highlight):]
                        
                        # Create new elements
                        new_elements = []
                        if before:
                            new_elements.append(before)
                            
                        highlight_span = soup.new_tag('span')
                        highlight_span['class'] = highlight_class
                        highlight_span['id'] = 'highlighted-text-wikifix'
                        highlight_span.string = match
                        new_elements.append(highlight_span)
                        
                        if after:
                            new_elements.append(after)
                        
                        # Replace the original text element
                        parent = element.parent
                        element.replace_with(*new_elements)
                        return True
            return False
        
        # Try simple highlighting as fallback
        simple_text_highlighting()
        
        return str(soup)
        
    except Exception as e:
        print(f"Error in highlight_text_in_html: {e}")
        # Ultimate fallback: simple string replacement
        escaped_text = re.escape(text_to_highlight)
        highlight_class = 'wikifix-highlight-exact' if match_type == 'exact' else 'wikifix-highlight-fuzzy'
        replacement = f'<span class="{highlight_class}" id="highlighted-text-wikifix">{text_to_highlight}</span>'
        return re.sub(escaped_text, replacement, html_content, count=1, flags=re.IGNORECASE)

@router.get("/wiki/{page_name:path}")
async def serve_wikipedia_page(
    page_name: str,
    highlight: Optional[str] = Query(None, description="Text to highlight on the page"),
    context: Optional[str] = Query(None, description="Context text to help with fuzzy matching"),
    auto_scroll: Optional[bool] = Query(True, description="Whether to auto-scroll to highlighted text")
):
    """
    Serve a local Wikipedia page with optional text highlighting.
    """
    try:
        # Security check: ensure page_name doesn't contain path traversal
        if ".." in page_name or page_name.startswith("/"):
            raise HTTPException(status_code=400, detail="Invalid page name")
        
        # Check if local file exists
        if not local_file_exists(page_name):
            raise HTTPException(
                status_code=404, 
                detail=f"Wikipedia page '{page_name}' not found locally. You may need to download it first."
            )
        
        file_path = local_url_to_file_path(page_name)
        
        # Read and fix the HTML content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the content to work with our local serving
        fixed_content = fix_html_content(content, page_name)
        
        # Add highlighting if text is provided
        if highlight and auto_scroll:
            # Pass context to help with highlighting
            fixed_content = add_highlight_javascript(fixed_content, highlight, context)
        
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
        
        # Decode URL (it comes URL-encoded)
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
