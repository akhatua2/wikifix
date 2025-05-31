# WikiFix - Wikipedia Highlighting System

A sophisticated Wikipedia content serving system with advanced text highlighting capabilities for fact-checking applications.

## Quick Overview

This system provides:
- **Local Wikipedia Content Serving**: Cache and serve Wikipedia pages locally
- **Advanced Text Highlighting**: Highlight specific text spans with fuzzy matching
- **Cross-Element Highlighting**: Handle text that spans multiple HTML elements
- **Unicode & Citation Support**: Properly handle Wikipedia's complex formatting
- **Task Integration**: Seamlessly integrate with fact-checking tasks

## Key Features

### ✨ Advanced Text Matching
- Multiple fallback strategies (exact → fuzzy → context → keyword → paragraph)
- Unicode normalization (handles dashes, quotes, spaces, HTML entities)
- Citation removal (both simple `[1]` and complex `<sup>` tags)
- Cross-element text highlighting for text spanning multiple HTML tags

### 🎨 User Experience
- Loading states with realistic Wikipedia skeleton
- Visual indicators for content type (claim vs evidence)
- Auto-scroll to highlighted content
- Graceful fallbacks and error handling

### 🔧 Technical Implementation
- BeautifulSoup for sophisticated HTML parsing
- Multiple iframe loading detection strategies
- PostMessage communication for cross-origin scenarios
- Context-aware parameter injection

## Architecture

```
Frontend (React/Next.js)
├── WikipediaEmbed Component
├── Task Detail Pages
└── Loading States & Error Handling

Backend (FastAPI)
├── Wikipedia API Router
├── URL Mapping System
├── Text Highlighting Engine
└── Task Integration
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Example Usage

The system automatically converts Wikipedia URLs in tasks:

```python
# Original task data
task = {
    "claim": {
        "url": "https://en.wikipedia.org/wiki/James_Webb_Space_Telescope",
        "text_span": "telescope must be kept extremely cold"
    }
}

# Automatically becomes
{
    "claim": {
        "url": "/api/wiki/James_Webb_Space_Telescope?highlight=telescope%20must%20be%20kept%20extremely%20cold&context=...",
        "text_span": "telescope must be kept extremely cold"
    }
}
```

## Highlighting Features

### Visual Styles
- **Exact Match**: Yellow highlight for precise matches
- **Fuzzy Match**: Orange highlight with border for close matches  
- **Keyword Match**: Gray highlight for keyword-based matches
- **Paragraph Match**: Blue border for paragraph-level highlighting

### Text Normalization
Handles complex Wikipedia formatting:
- HTML entities (`&#160;` → space, `&#8211;` → dash)
- Unicode characters (en-dash, em-dash, smart quotes)
- Citations (`<sup>...</sup>`, `[1]`, `[citation needed]`)
- Cross-element text spans

## API Endpoints

- `GET /api/wiki/{page_name}` - Serve Wikipedia page with highlighting
- `GET /api/wiki-static/{file_path}` - Serve static assets
- `GET /api/download/{url}` - Download Wikipedia page on-demand
- `GET /api/status/{page_name}` - Check page availability

## Contributing

This system was built to handle the complex requirements of Wikipedia content highlighting for fact-checking applications. The implementation prioritizes accuracy and user experience over aggressive highlighting.

## Documentation

For comprehensive technical documentation covering all features, see:
**[WIKIPEDIA_HIGHLIGHTING_SYSTEM.md](./WIKIPEDIA_HIGHLIGHTING_SYSTEM.md)**

This documentation covers:
- Complete system architecture
- Advanced text matching algorithms
- Frontend UX implementation details
- Performance optimizations
- Troubleshooting guide
- Future enhancement possibilities

## License

MIT License 