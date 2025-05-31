# Wikipedia Highlighting System - Comprehensive Documentation

## Overview

This system provides local Wikipedia content serving with advanced text highlighting capabilities. It replaces direct Wikipedia URLs with locally cached copies, enabling precise text highlighting, auto-scrolling, and improved user experience for fact-checking tasks.

## System Architecture

### Backend Components

#### 1. Wikipedia API Router (`backend/api/wikipedia.py`)
- **Purpose**: Serves local Wikipedia files with advanced text highlighting
- **Main Endpoints**:
  - `/api/wiki/{page_name}` - Serves Wikipedia pages with highlighting
  - `/api/wiki-static/{file_path}` - Serves static assets (CSS, JS, images)
  - `/api/download/{url}` - Downloads Wikipedia pages on-demand
  - `/api/status/{page_name}` - Checks local availability

#### 2. URL Mapping System (`backend/utils/url_mapping.py`)
- **Purpose**: Converts Wikipedia URLs to local URLs with highlighting parameters
- **Features**:
  - Automatic detection of locally available pages
  - Text span parameter injection
  - Context parameter support for better matching
  - Fragment preservation from original URLs

#### 3. Task Integration (`backend/main.py`)
- **Purpose**: Integrates highlighting with task management system
- **Features**:
  - Automatic URL conversion in all task endpoints
  - Support for both claim and evidence highlighting
  - Context-aware parameter injection

### Frontend Components

#### 1. WikipediaEmbed Component (`frontend/src/components/WikipediaEmbed.tsx`)
- **Purpose**: Displays Wikipedia content in iframe with loading states and error handling
- **Features**:
  - Advanced loading detection with multiple strategies
  - PostMessage communication with iframe content
  - Timeout handling and fallback mechanisms
  - Visual status indicators

#### 2. Task Detail Page (`frontend/src/app/tasks/[taskId]/page.tsx`)
- **Purpose**: Integrates Wikipedia viewing with fact-checking tasks
- **Features**:
  - Content type tracking (claim vs evidence)
  - Visual indicators showing current content
  - Dynamic highlight text selection based on content type

## Text Highlighting Features

### 1. Advanced Text Matching

#### Multiple Matching Strategies
1. **Exact Match**: Direct text search (case-insensitive)
2. **Sentence Match**: Breaks long text into sentences for better matching
3. **Fuzzy Match**: Uses sequence matching with normalized text
4. **Context Match**: Uses task context when precise text isn't found
5. **Keyword Match**: Falls back to matching multiple keywords
6. **Paragraph Match**: Highlights entire relevant paragraphs as last resort

#### Text Normalization
```python
def normalize_text_for_matching(text: str) -> str:
    # Handles:
    # - HTML entity decoding (&#160; → space)
    # - Unicode normalization (various dashes → hyphen)
    # - Citation removal (<sup>...</sup> and [1])
    # - Quote normalization (smart quotes → standard)
    # - Whitespace normalization
```

**Supported Unicode Characters**:
- **Spaces**: Non-breaking space (&#160;), thin space, em space, en space
- **Dashes**: En dash (–), em dash (—), minus sign (−), various hyphens
- **Quotes**: Smart quotes (""''), prime symbols, various quotation marks

### 2. Cross-Element Text Highlighting

#### Problem Solved
Wikipedia text often spans multiple HTML elements:
```html
<!-- Text like this: -->
<a href="...">Space Telescope Science Institute</a> in <a href="...">Baltimore</a>
<!-- Can now be highlighted as a single span -->
```

#### Solution
- Uses BeautifulSoup for sophisticated HTML parsing
- Advanced regex patterns that handle text across element boundaries
- Preserves HTML structure while adding highlighting spans

### 3. Citation Handling

#### Simple Citations
- Removes bracket citations: `[1]`, `[citation needed]`, `[clarification needed]`

#### Complex Wikipedia Citations
```html
<!-- Removes complex citation structures like: -->
<sup class="reference" id="cite_ref-...">
  <a href="...">
    <span class="cite-bracket">[</span>5<span class="cite-bracket">]</span>
  </a>
</sup>
```

### 4. Highlighting Styles

#### CSS Classes and Visual Styles
- **`.wikifix-highlight-exact`**: Yellow background for exact matches
- **`.wikifix-highlight-fuzzy`**: Light orange with left border for fuzzy matches
- **`.wikifix-highlight-keyword`**: Light gray with left border for keyword matches  
- **`.wikifix-highlight-paragraph`**: Blue border and background for paragraph highlighting

#### Visual Effects
- Subtle hover effects with opacity changes
- Smooth CSS transitions (0.3s ease)
- Auto-scroll animations with pulse effect
- Scroll margin for proper positioning

## Frontend User Experience

### 1. Loading State Management

#### Multiple Detection Strategies
1. **onLoad Event**: Standard iframe loading detection
2. **ContentDocument Check**: Direct document ready state checking
3. **ContentWindow Validation**: Cross-origin compatible checking
4. **Periodic Polling**: Checks iframe state every 500ms
5. **Timeout Fallback**: 8-second timeout for complex content
6. **PostMessage Communication**: Iframe sends ready signals

#### Loading Shimmer
- Realistic Wikipedia page skeleton
- Article title, paragraphs, image placeholders
- Table of contents simulation
- Animated loading indicators with status text

### 2. Error Handling

#### Graceful Fallbacks
- **Loading Timeout**: Falls back to assuming success after 8 seconds
- **Cross-Origin Errors**: Handles iframe restrictions gracefully
- **Network Issues**: Provides "Open on Wikipedia" button
- **Missing Content**: Clear error messages with retry options

#### User Feedback
- Real-time loading status display
- Error state with actionable buttons
- Progressive enhancement (works without JavaScript)

### 3. Visual Indicators

#### Status Badges
- **"Local Copy"**: Green badge showing content is served locally
- **"Text Highlighted"**: Indicates active text highlighting
- **"Viewing"**: Shows which content section is currently displayed

#### Content Type Indicators
- **Claim Content**: Blue highlighting and "Viewing" badge
- **Evidence Content**: Green highlighting and "Viewing" badge
- **Visual Distinction**: Different background colors and borders

## URL Handling and Parameter System

### 1. URL Conversion Logic

#### Automatic Detection
```python
# Converts Wikipedia URLs to local URLs when available
https://en.wikipedia.org/wiki/COVID-19_pandemic
↓
/api/wiki/COVID-19_pandemic?highlight=text&context=additional_context
```

#### Parameter Injection
- **highlight**: The text to highlight on the page
- **context**: Additional context for better fuzzy matching
- **auto_scroll**: Whether to auto-scroll to highlighted content (default: true)

### 2. Fragment Preservation
- Preserves Wikipedia URL fragments (`#section`)
- Converts to local equivalents (`/api/wiki/page#section`)
- Maintains browser's native fragment scrolling

### 3. Text Fragment Support
- Supports browser's native text fragments (`#:~:text=`)
- Converts to highlighting parameters for local content
- Fallback to original Wikipedia with text fragments

## Backend Performance and Reliability

### 1. HTML Content Processing

#### Content Fixing Pipeline
1. **Relative Link Conversion**: `/wiki/` → `/api/wiki/`
2. **Static Asset Routing**: CSS/JS/images → `/api/wiki-static/`
3. **Internal Link Fixing**: Same-page anchors preserved
4. **Image URL Handling**: Upload.wikimedia.org links preserved

#### MIME Type Detection
- Automatic content-type detection for static files
- Proper headers for CSS, JS, images
- Fallback to `application/octet-stream`

### 2. Error Handling and Security

#### Security Measures
- Path traversal protection (`..` detection)
- File existence validation
- URL validation for Wikipedia domains
- Sandbox attributes for iframes

#### Error Responses
- 404 for missing pages with helpful messages
- 400 for invalid requests
- 500 with detailed error information (in development)

## Integration with Task System

### 1. Task Data Structure

#### Supported Fields
```typescript
interface TaskData {
  claim: {
    url?: string;
    text_span?: string;
    context?: string;
  };
  evidence: {
    url?: string;
    text_span?: string;
    context?: string;
  };
}
```

### 2. Automatic URL Processing

#### Task Endpoints Enhanced
- `/api/tasks` - All tasks with URL conversion
- `/api/tasks/rand` - Random task with URL conversion  
- `/api/tasks/{id}` - Single task with URL conversion
- `/api/users/{id}/completed-tasks/list` - Completed tasks with URL conversion

#### Conversion Logic
```python
def convert_task_urls_to_local(task_data: dict) -> dict:
    # Handles both claim and evidence URLs
    # Adds text_span and context parameters
    # Falls back gracefully when local files don't exist
```

### 3. Context-Aware Highlighting

#### Smart Parameter Usage
- Uses `claim.context` for better claim text matching
- Uses `evidence.context` for better evidence text matching
- Improves fuzzy matching accuracy significantly

## Browser Compatibility and Standards

### 1. Text Fragment API Support
- Leverages browser's native `#:~:text=` API when available
- Graceful fallback for unsupported browsers
- Maintains compatibility with Wikipedia's native highlighting

### 2. Cross-Origin Handling
- Proper iframe sandbox configuration
- PostMessage communication for cross-origin scenarios
- Fallback mechanisms when cross-origin restrictions apply

### 3. Modern Web Standards
- Uses modern CSS features (CSS Grid, Flexbox, CSS Variables)
- Progressive enhancement approach
- Responsive design principles

## Performance Optimizations

### 1. Caching Strategy
- Local file serving eliminates external requests
- Static asset caching through proper headers
- BeautifulSoup parsing optimization

### 2. Loading Optimizations
- Lazy iframe loading
- Chunked content processing
- Efficient regex patterns
- Minimal DOM manipulation

### 3. Memory Management
- Cleanup of timers and event listeners
- Efficient text processing algorithms
- Minimal JavaScript injection

## Debugging and Monitoring

### 1. Console Logging
- Detailed text matching process logs
- Loading state transitions
- Error conditions and fallbacks
- PostMessage communication events

### 2. Visual Debug Information
- Loading status display in UI
- Match type indicators
- Error state visualization
- Performance timing indicators

## Future Enhancement Possibilities

### 1. Advanced Features
- Multi-language support
- Custom highlighting colors
- Text-to-speech integration
- Accessibility improvements

### 2. Performance Improvements
- Server-side caching
- Streaming content delivery
- WebAssembly text processing
- Service Worker integration

### 3. Analytics and Insights
- Highlighting accuracy metrics
- User interaction tracking
- Performance monitoring
- A/B testing framework

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Text Not Highlighting
- **Cause**: Text contains special Unicode characters
- **Solution**: Enhanced normalize_text_for_matching handles this
- **Verification**: Check browser console for matching logs

#### 2. Iframe Loading Issues
- **Cause**: Cross-origin restrictions or slow content
- **Solution**: Multiple detection strategies with timeout fallback
- **Verification**: Check network tab and console messages

#### 3. Partial Text Highlighting
- **Cause**: Text spans across multiple HTML elements
- **Solution**: Cross-element highlighting algorithm handles this
- **Expected Behavior**: Conservative highlighting is often better than incorrect highlighting

#### 4. Local Content Not Available
- **Cause**: Page not downloaded to local cache
- **Solution**: Automatic fallback to original Wikipedia URL
- **Enhancement**: On-demand downloading feature available

This comprehensive system provides robust, user-friendly Wikipedia content integration with advanced highlighting capabilities, making it ideal for fact-checking applications and educational tools. 