#!/usr/bin/env python3
"""
Ultra-simple Wikipedia processor for WikiFix.
Does everything in one place: download pages, highlight text, store in DB.
"""

import json
import re
import subprocess
import urllib.parse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import sys
from rapidfuzz import process, fuzz

# Add backend to path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from db.tasks_ops import Task, TaskStatus, AsyncSessionLocal


class WikipediaProcessor:
    """Simple Wikipedia processor that does everything."""
    
    def __init__(self):
        # Use absolute path for saved_site
        self.saved_dir = Path("/data1/akhatua/wikifix/backend/saved_site")
        self.saved_dir.mkdir(exist_ok=True)
        
    def extract_page_name(self, url: str) -> str:
        """Extract Wikipedia page name from URL."""
        if not url or 'wikipedia.org' not in url:
            return ""
        
        # Clean URL and extract page name
        clean_url = url.split('#')[0].split('?')[0]
        match = re.match(r'https?://en\.wikipedia\.org/wiki/(.+)', clean_url)
        return match.group(1) if match else ""
    
    def get_local_path(self, page_name: str) -> Path:
        """Get local file path for a Wikipedia page."""
        page_name = urllib.parse.unquote(page_name)
        return self.saved_dir / "en.wikipedia.org" / "wiki" / f"{page_name}.html"
    
    def download_page(self, url: str) -> bool:
        """Download a Wikipedia page using wget."""
        page_name = self.extract_page_name(url)
        if not page_name:
            print(f"❌ Invalid URL: {url}")
            return False
            
        local_path = self.get_local_path(page_name)
        if local_path.exists():
            print(f"✅ Already exists: {page_name}")
            return True
            
        print(f"📥 Downloading: {page_name}")
        
        try:
            cmd = [
                'wget', '--mirror', '--convert-links', '--adjust-extension',
                '--page-requisites', '--no-parent', '-P', str(self.saved_dir), url
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                print(f"✅ Downloaded: {page_name}")
                return True
            else:
                print(f"❌ Failed: {page_name} - {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error downloading {page_name}: {e}")
            return False
    
    def split_html_by_sentence(self, html_content: str) -> List[str]:
        """Split HTML content into sentences, preserving all HTML formatting."""
        from html_sentence_splitter import split_html_by_sentence
        return split_html_by_sentence(html_content)

    def highlight_text_in_html(self, html_content: str, text_to_find: str) -> Tuple[str, bool]:
        """Find and highlight text in HTML content using fuzzy matching on sentence chunks."""
        if not text_to_find or not html_content:
            return html_content, False
        
        html_content = re.sub(r'<a [^>]*>(.*?)</a>', r'\1', html_content, flags=re.DOTALL)

        # Use only the first sentence of text_to_find
        first_sentence_match = re.match(r'(.+?[.!?])', text_to_find.strip(), re.DOTALL)
        if first_sentence_match:
            text_to_match = first_sentence_match.group(1).strip()
        else:
            text_to_match = text_to_find.strip()

        print(f"🔍 Fuzzy matching on HTML sentences for: '{text_to_match[:50]}...'")

        # Get sentence chunks
        html_chunks = self.split_html_by_sentence(html_content)

        if not html_chunks:
            print("❌ No sentence chunks found for matching")
            return html_content, False

        print(f"🔍 Searching {len(html_chunks)} sentence chunks...")

        # Find best match using lower threshold for HTML content
        result = process.extractOne(
            text_to_match,
            html_chunks,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=10  # Lower threshold for HTML content
        )

        if result:
            best_match_html, score, _ = result
            print(f"✅ Best HTML match (score {score:.1f}): '{best_match_html[:50]}...'")

            # Highlight safely - find first substantial text node without breaking HTML structure
            text_match = re.search(r'>([^<]{20,}?)[<.]', best_match_html)  # Find text nodes with 20+ chars
            if text_match:
                text_to_highlight = text_match.group(1).strip()
                inner_highlighted = best_match_html.replace(text_to_highlight, f'<span class="wikifix-highlight" id="highlighted-text">{text_to_highlight}</span>', 1)
            else:
                inner_highlighted = f'<span class="wikifix-highlight" id="highlighted-text">{best_match_html}</span>'
            highlighted = html_content.replace(best_match_html, inner_highlighted, 1)

            # Check if highlighting worked
            success = 'wikifix-highlight' in highlighted

            if success:
                # Add simple yellow highlight CSS
                css = """
<style>
.wikifix-highlight {
    background-color: yellow !important;
}
</style>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const highlighted = document.getElementById('highlighted-text');
    if (highlighted) {
        setTimeout(() => highlighted.scrollIntoView({behavior: 'smooth', block: 'center'}), 500);
    }
});
</script>"""

                if '<head>' in highlighted:
                    highlighted = highlighted.replace('<head>', f'<head>{css}', 1)
                else:
                    highlighted = css + highlighted

                print(f"✅ Successfully highlighted HTML content")
                return highlighted, True
            else:
                print(f"❌ Failed to highlight HTML content")
                return html_content, False
        else:
            print(f"❌ No good HTML matches found (min score: 50)")
            return html_content, False
    
    def fix_html_urls(self, html_content: str, page_name: str) -> str:
        """Fix URLs in HTML for local serving."""
        # Fix Wikipedia links
        html_content = re.sub(r'href="(/wiki/[^"]+)"', r'href="/api\1"', html_content)
        
        # Fix internal anchors
        html_content = re.sub(r'href="(#[^"]+)"', rf'href="/api/wiki/{page_name}\1"', html_content)
        
        # Fix static resources
        html_content = re.sub(r'href="(/w/[^"]*\.css[^"]*)"', r'href="/api/wiki-static\1"', html_content)
        html_content = re.sub(r'src="(/w/[^"]*\.js[^"]*)"', r'src="/api/wiki-static\1"', html_content)
        html_content = re.sub(r'src="(/w/[^"]*\.(png|jpg|jpeg|gif|svg|webp)[^"]*)"', r'src="/api/wiki-static\1"', html_content)
        
        # Fix external images
        html_content = re.sub(r'src="(//upload\.wikimedia\.org/[^"]*)"', r'src="https:\1"', html_content)
        
        return html_content
    
    def process_single_task(self, anli_item: Dict) -> Optional[Dict]:
        """Process a single ANLI item into highlighted HTML."""
        print(f"\n=== Processing Task ===")
        print(f"Claim: {anli_item.get('claim', 'N/A')[:50]}...")
        
        # Extract URLs and text spans
        claim_url = anli_item.get("document_url", "")
        evidence_url = anli_item.get("evidence_url", "")
        claim_text = anli_item.get("claim_text_span", "")
        evidence_text = anli_item.get("evidence_sentence", "")
        
        if not all([claim_url, evidence_url, claim_text, evidence_text]):
            print("❌ Missing required data")
            return None
        
        # Download pages
        if not self.download_page(claim_url) or not self.download_page(evidence_url):
            print("❌ Failed to download pages")
            return None
        
        # Process claim
        claim_page = self.extract_page_name(claim_url)
        claim_path = self.get_local_path(claim_page)
        
        try:
            with open(claim_path, 'r', encoding='utf-8') as f:
                claim_html = f.read()
            
            claim_html = self.fix_html_urls(claim_html, claim_page)
            claim_highlighted, claim_success = self.highlight_text_in_html(claim_html, claim_text)
            
        except Exception as e:
            print(f"❌ Error processing claim: {e}")
            return None
        
        # Process evidence
        evidence_page = self.extract_page_name(evidence_url)
        evidence_path = self.get_local_path(evidence_page)
        
        try:
            with open(evidence_path, 'r', encoding='utf-8') as f:
                evidence_html = f.read()
            
            evidence_html = self.fix_html_urls(evidence_html, evidence_page)
            evidence_highlighted, evidence_success = self.highlight_text_in_html(evidence_html, evidence_text)
            
        except Exception as e:
            print(f"❌ Error processing evidence: {e}")
            return None
        
        # Only proceed if at least one highlighting worked
        if not (claim_success or evidence_success):
            print("❌ No highlighting successful")
            return None
        
        print(f"✅ Success - Claim: {'✅' if claim_success else '❌'}, Evidence: {'✅' if evidence_success else '❌'}")
        
        return {
            "anli_item": anli_item,
            "claim_highlighted_html": claim_highlighted if claim_success else None,
            "evidence_highlighted_html": evidence_highlighted if evidence_success else None,
            "claim_success": claim_success,
            "evidence_success": evidence_success
        }
    
    async def create_task_in_db(self, processed_data: Dict) -> Optional[str]:
        """Create a task in the database."""
        anli_item = processed_data["anli_item"]
        
        async with AsyncSessionLocal() as session:
            task = Task(
                # Claim data
                claim_sentence=anli_item.get("claim", ""),
                claim_context=anli_item.get("claim_context", ""),
                claim_document_title=anli_item.get("document_title", ""),
                claim_text_span=anli_item.get("claim_text_span", ""),
                claim_url=anli_item.get("document_url", ""),
                claim_highlighted_html=processed_data.get("claim_highlighted_html"),
                
                # Evidence data
                evidence_sentence=anli_item.get("evidence_sentence", ""),
                evidence_context=anli_item.get("evidence", ""),
                evidence_document_title=anli_item.get("evidence_document_title", ""),
                evidence_text_span=anli_item.get("evidence_sentence", ""),
                evidence_url=anli_item.get("evidence_url", ""),
                evidence_highlighted_html=processed_data.get("evidence_highlighted_html"),
                
                # LLM analysis
                llm_analysis=anli_item.get("llm_report", {}).get("analysis", ""),
                contradiction_type=anli_item.get("llm_report", {}).get("contradiction_type", ""),
                
                status=TaskStatus.OPEN
            )
            
            session.add(task)
            await session.commit()
            await session.refresh(task)
            
            return task.id
    
    async def process_anli_file(self, json_path: str, limit: Optional[int] = None) -> Dict[str, int]:
        """Process entire ANLI JSON file and populate database."""
        print(f"🚀 Processing ANLI file: {json_path}")
        
        # Load JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            anli_data = json.load(f)
        
        if limit:
            anli_data = anli_data[:limit]
        
        print(f"📊 Processing {len(anli_data)} items")
        
        # Process each item
        successful = 0
        failed = 0
        
        for i, anli_item in enumerate(anli_data, 1):
            print(f"\n📝 Item {i}/{len(anli_data)}")
            
            processed = self.process_single_task(anli_item)
            if processed:
                task_id = await self.create_task_in_db(processed)
                if task_id:
                    successful += 1
                    print(f"✅ Created task: {task_id}")
                else:
                    failed += 1
                    print("❌ Failed to create task in DB")
            else:
                failed += 1
                print("❌ Failed to process task")
            
            # Progress update
            if i % 10 == 0:
                print(f"\n📈 Progress: {i}/{len(anli_data)} - Success: {successful}, Failed: {failed}")
        
        print(f"\n🎉 Complete! Successful: {successful}, Failed: {failed}")
        return {"successful": successful, "failed": failed, "total": len(anli_data)}


# Simple functions for API use
def get_local_html_content(page_name: str) -> Optional[str]:
    """Get local HTML content for a page (for API serving)."""
    processor = WikipediaProcessor()
    path = processor.get_local_path(page_name)
    
    if not path.exists():
        return None
        
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return processor.fix_html_urls(content, page_name)
    except Exception:
        return None 