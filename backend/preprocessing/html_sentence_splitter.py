#!/usr/bin/env python3
"""
HTML-aware sentence splitter that maintains valid HTML structure.
"""

import re
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class HTMLChunk:
    content: str
    is_block_boundary: bool = False


class HTMLSentenceSplitter:
    """Split HTML into sentence chunks while maintaining valid HTML structure."""
    
    def __init__(self):
        # Block elements that create natural boundaries
        self.block_elements = {
            'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
            'li', 'ul', 'ol', 'section', 'article', 'header', 
            'footer', 'main', 'aside', 'figure', 'figcaption',
            'blockquote', 'pre', 'table', 'tr', 'td', 'th'
        }
        
        # Self-closing elements
        self.self_closing = {
            'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 
            'base', 'col', 'embed', 'source', 'track', 'wbr'
        }
        
        # Sentence ending punctuation
        self.sentence_endings = {'.', '!', '?'}

    def split_html_by_sentence(self, html_content: str) -> List[str]:
        """Split HTML content into sentence chunks, preserving HTML structure."""
        # First split on major block boundaries
        block_chunks = self._split_by_blocks(html_content)
        
        # Then split each block chunk by sentences
        final_chunks = []
        for chunk in block_chunks:
            if chunk.is_block_boundary:
                # Block boundary chunks go as-is
                if chunk.content.strip():
                    final_chunks.append(chunk.content)
            else:
                # Split content chunks by sentences
                sentence_chunks = self._split_content_by_sentences(chunk.content)
                final_chunks.extend(sentence_chunks)
        
        # Filter out very short chunks
        return [chunk for chunk in final_chunks if len(chunk.strip()) > 15]

    def _split_by_blocks(self, html: str) -> List[HTMLChunk]:
        """Split HTML on block element boundaries."""
        chunks = []
        current = []
        i = 0
        
        while i < len(html):
            if html[i] == '<':
                # Find the end of the tag
                tag_end = html.find('>', i)
                if tag_end == -1:
                    current.append(html[i])
                    i += 1
                    continue
                
                tag = html[i:tag_end + 1]
                
                # Check if this is a block element boundary
                if self._is_block_boundary(tag):
                    # Add current content as content chunk
                    if current:
                        chunks.append(HTMLChunk(''.join(current), False))
                        current = []
                    
                    # Add block tag as boundary chunk
                    chunks.append(HTMLChunk(tag, True))
                else:
                    current.append(tag)
                
                i = tag_end + 1
            else:
                current.append(html[i])
                i += 1
        
        # Add remaining content
        if current:
            chunks.append(HTMLChunk(''.join(current), False))
        
        return chunks

    def _is_block_boundary(self, tag: str) -> bool:
        """Check if a tag represents a block boundary."""
        # Extract tag name
        tag_match = re.match(r'</?(\w+)', tag)
        if not tag_match:
            return False
        
        tag_name = tag_match.group(1).lower()
        return tag_name in self.block_elements

    def _split_content_by_sentences(self, content: str) -> List[str]:
        """Split content by sentences while maintaining HTML validity."""
        if not content.strip():
            return []
        
        # Track HTML tag nesting
        tag_stack = []
        chunks = []
        current = []
        i = 0
        
        while i < len(content):
            char = content[i]
            
            if char == '<':
                # Parse HTML tag
                tag_end = content.find('>', i)
                if tag_end == -1:
                    current.append(char)
                    i += 1
                    continue
                
                tag = content[i:tag_end + 1]
                current.append(tag)
                
                # Update tag stack
                self._update_tag_stack(tag, tag_stack)
                
                i = tag_end + 1
                
            elif char in self.sentence_endings and not tag_stack:
                # Potential sentence boundary (only if not inside tags)
                current.append(char)
                
                # Look ahead for whitespace or end
                j = i + 1
                while j < len(content) and content[j] in ' \t\n\r':
                    current.append(content[j])
                    j += 1
                
                # If we're at end or next char starts new sentence, split here
                if j >= len(content) or content[j].isupper() or content[j] == '<':
                    chunk_content = ''.join(current).strip()
                    if chunk_content:
                        chunks.append(chunk_content)
                    current = []
                    i = j - 1
                
                i += 1
                
            else:
                current.append(char)
                i += 1
        
        # Add remaining content
        if current:
            chunk_content = ''.join(current).strip()
            if chunk_content:
                chunks.append(chunk_content)
        
        return chunks

    def _update_tag_stack(self, tag: str, tag_stack: List[str]) -> None:
        """Update the tag stack based on the current tag."""
        # Parse tag
        tag_match = re.match(r'<(/?)(\w+)', tag)
        if not tag_match:
            return
        
        is_closing = bool(tag_match.group(1))
        tag_name = tag_match.group(2).lower()
        
        # Skip self-closing tags
        if tag_name in self.self_closing or tag.endswith('/>'):
            return
        
        if is_closing:
            # Pop from stack if it matches
            if tag_stack and tag_stack[-1] == tag_name:
                tag_stack.pop()
        else:
            # Push to stack
            tag_stack.append(tag_name)


# Simple function for the main processor to use
def split_html_by_sentence(html_content: str) -> List[str]:
    """Split HTML content into sentence chunks."""
    splitter = HTMLSentenceSplitter()
    return splitter.split_html_by_sentence(html_content) 