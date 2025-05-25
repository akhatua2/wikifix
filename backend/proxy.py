from fastapi import APIRouter, HTTPException
import httpx
from bs4 import BeautifulSoup
from typing import Optional
from urllib.parse import urlparse

router = APIRouter()

@router.get("/{path:path}")
async def get_wikipedia_content(path: str):
    try:
        # Construct the full Wikipedia URL
        wiki_url = f"https://en.wikipedia.org/wiki/{path}"
        
        # Validate URL
        parsed = urlparse(wiki_url)
        if not parsed.netloc.endswith('wikipedia.org'):
            raise HTTPException(status_code=400, detail="Invalid Wikipedia URL")

        async with httpx.AsyncClient() as client:
            # Fetch the Wikipedia page
            response = await client.get(wiki_url)
            response.raise_for_status()
            
            # Parse the HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract the main content
            content = soup.find('div', {'id': 'mw-content-text'})
            if not content:
                raise HTTPException(status_code=404, detail="Content not found")
            
            # Remove unnecessary elements
            for element in content.find_all(['script', 'style', 'sup', 'table']):
                element.decompose()
            
            # Convert relative links to absolute
            for link in content.find_all('a'):
                if link.get('href', '').startswith('/'):
                    link['href'] = f"https://en.wikipedia.org{link['href']}"
            
            # Add base styles
            styles = """
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
                a { color: #1a73e8; text-decoration: none; }
                a:hover { text-decoration: underline; }
                h1, h2, h3 { color: #202124; }
                p { line-height: 1.6; color: #202124; }
                .mw-editsection { display: none; }
            </style>
            """
            
            # Return the processed content
            return {
                "content": str(content),
                "title": soup.find('h1', {'id': 'firstHeading'}).text if soup.find('h1', {'id': 'firstHeading'}) else "",
                "styles": styles
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=e.response.status_code if hasattr(e, 'response') else 500, 
                          detail="Failed to fetch Wikipedia content")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 