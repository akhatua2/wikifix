import React, { useState, useCallback, useRef, useEffect } from 'react';

interface WikipediaEmbedProps {
  wikiUrl: string;
  highlightText?: string;
}

export default function WikipediaEmbed({ wikiUrl, highlightText }: WikipediaEmbedProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<'initial' | 'loading' | 'ready' | 'error'>('initial');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const getDisplayUrl = (url: string, text?: string) => {
    if (!url) return '';
    
    // Check if it's a local API URL
    if (url.startsWith('/api/wiki/')) {
      // Convert to full URL for iframe
      const fullLocalUrl = `${API_URL}${url}`;
      
      // If there's additional highlight text not already in the URL, add it
      if (text && !url.includes('highlight=')) {
        const encodedText = encodeURIComponent(text);
        const separator = url.includes('?') ? '&' : '?';
        return `${fullLocalUrl}${separator}highlight=${encodedText}`;
      }
      return fullLocalUrl;
    }
    
    // External Wikipedia URL - add highlight text if provided
    if (text) {
      const encodedText = encodeURIComponent(text);
      return `${url}#:~:text=${encodedText}`;
    }
    
    return url;
  };

  const getOpenInNewTabUrl = (url: string, text?: string) => {
    // For local URLs, we want to open the original Wikipedia page in a new tab
    if (url.startsWith('/api/wiki/')) {
      // Extract page name from local URL
      let pageName = url.replace('/api/wiki/', '');
      
      // Remove query parameters to get clean page name
      if (pageName.includes('?')) {
        pageName = pageName.split('?')[0];
      }
      
      const originalUrl = `https://en.wikipedia.org/wiki/${pageName}`;
      
      // If there's highlight text in the URL or passed as prop, add it
      let textToHighlight = text;
      
      // Extract highlight parameter from URL if it exists
      if (url.includes('highlight=')) {
        const urlParams = new URLSearchParams(url.split('?')[1] || '');
        const highlightParam = urlParams.get('highlight');
        if (highlightParam) {
          textToHighlight = decodeURIComponent(highlightParam);
        }
      }
      
      if (textToHighlight) {
        const encodedText = encodeURIComponent(textToHighlight);
        return `${originalUrl}#:~:text=${encodedText}`;
      }
      return originalUrl;
    }
    
    // External URL - use as is with highlight
    return getDisplayUrl(url, text);
  };

  // Multiple detection strategies for iframe loading
  const checkIframeLoaded = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return false;

    try {
      // Strategy 1: Check if iframe has a contentDocument (same-origin only)
      const doc = iframe.contentDocument;
      if (doc && doc.readyState === 'complete') {
        console.log('WikipediaEmbed: Iframe detected as loaded via contentDocument');
        return true;
      }
    } catch (e) {
      // Cross-origin restriction - this is expected for external URLs
    }

    try {
      // Strategy 2: Check if iframe.contentWindow exists (broader compatibility)
      if (iframe.contentWindow) {
        console.log('WikipediaEmbed: Iframe contentWindow exists, assuming loaded');
        return true;
      }
    } catch (e) {
      // Some browsers may restrict this too
    }

    // Strategy 3: Check if the src attribute matches what we set
    // This indicates the browser at least attempted to load the URL
    if (iframe.src && iframe.src !== 'about:blank') {
      console.log('WikipediaEmbed: Iframe has valid src, assuming loaded');
      return true;
    }

    return false;
  }, []);

  const handleLoadingComplete = useCallback(() => {
    console.log('WikipediaEmbed: Loading completed successfully');
    setIsLoading(false);
    setHasError(false);
    setLoadingStatus('ready');
    
    // Clear all timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  const handleLoadingError = useCallback(() => {
    console.error('WikipediaEmbed: Loading failed');
    setIsLoading(false);
    setHasError(true);
    setLoadingStatus('error');
    
    // Clear all timers
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Enhanced iframe event handlers
  const handleIframeLoad = useCallback(() => {
    console.log('WikipediaEmbed: onLoad event fired');
    handleLoadingComplete();
  }, [handleLoadingComplete]);

  const handleIframeError = useCallback(() => {
    console.error('WikipediaEmbed: onError event fired');
    handleLoadingError();
  }, [handleLoadingError]);

  // Reset loading state when URL changes
  useEffect(() => {
    if (wikiUrl) {
      console.log('WikipediaEmbed: URL changed, resetting loading state');
      setIsLoading(true);
      setHasError(false);
      setLoadingStatus('loading');
      
      // Clear any existing timers
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      // Strategy 1: Periodic checking for iframe loaded state
      checkIntervalRef.current = setInterval(() => {
        if (checkIframeLoaded()) {
          handleLoadingComplete();
        }
      }, 500); // Check every 500ms
      
      // Strategy 2: Fallback timeout - assume loaded after reasonable time
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('WikipediaEmbed: Timeout reached, assuming iframe loaded');
        
        // For local URLs (our backend), we can be more aggressive about assuming success
        if (wikiUrl.startsWith('/api/wiki/')) {
          handleLoadingComplete();
        } else {
          // For external URLs, check if iframe is still valid before assuming success
          if (iframeRef.current && iframeRef.current.src) {
            handleLoadingComplete();
          } else {
            handleLoadingError();
          }
        }
      }, 8000); // 8 second timeout for more complex content
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [wikiUrl, checkIframeLoaded, handleLoadingComplete, handleLoadingError]);

  // Listen for postMessage from iframe (if it supports it)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from our backend API
      if (event.origin === API_URL) {
        if (event.data === 'iframe-ready' || event.data.type === 'iframe-ready') {
          console.log('WikipediaEmbed: Received ready message from iframe');
          handleLoadingComplete();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [API_URL, handleLoadingComplete]);

  const finalUrl = getDisplayUrl(wikiUrl, highlightText);
  const newTabUrl = getOpenInNewTabUrl(wikiUrl, highlightText);

  const isLocalUrl = wikiUrl.startsWith('/api/wiki/');

  // Check if highlighting is enabled (either in URL or as prop)
  const hasHighlighting = highlightText || (isLocalUrl && wikiUrl.includes('highlight='));

  function handleOpenInNewTab() {
    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
  }

  // Enhanced Shimmer/Skeleton Component with status
  const LoadingShimmer = () => (
    <div className="h-full w-full bg-white rounded-lg border border-[#f1f2f4] overflow-hidden relative animate-pulse">
      {/* Header shimmer */}
      <div className="bg-gray-200 h-16 w-full"></div>
      
      {/* Content area shimmer */}
      <div className="p-6 space-y-4">
        {/* Title shimmer */}
        <div className="bg-gray-200 h-8 w-3/4 rounded"></div>
        
        {/* Paragraph shimmers */}
        <div className="space-y-3">
          <div className="bg-gray-200 h-4 w-full rounded"></div>
          <div className="bg-gray-200 h-4 w-5/6 rounded"></div>
          <div className="bg-gray-200 h-4 w-4/5 rounded"></div>
        </div>
        
        {/* Image placeholder */}
        <div className="bg-gray-200 h-48 w-full rounded"></div>
        
        {/* More paragraph shimmers */}
        <div className="space-y-3">
          <div className="bg-gray-200 h-4 w-full rounded"></div>
          <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
          <div className="bg-gray-200 h-4 w-5/6 rounded"></div>
          <div className="bg-gray-200 h-4 w-2/3 rounded"></div>
        </div>
        
        {/* Table of contents shimmer */}
        <div className="bg-gray-100 p-4 rounded">
          <div className="bg-gray-200 h-4 w-1/3 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="bg-gray-200 h-3 w-1/2 rounded"></div>
            <div className="bg-gray-200 h-3 w-2/5 rounded"></div>
            <div className="bg-gray-200 h-3 w-3/5 rounded"></div>
          </div>
        </div>
        
        {/* More content shimmers */}
        <div className="space-y-3">
          <div className="bg-gray-200 h-4 w-full rounded"></div>
          <div className="bg-gray-200 h-4 w-4/5 rounded"></div>
          <div className="bg-gray-200 h-4 w-5/6 rounded"></div>
        </div>
      </div>
      
      {/* Loading indicator overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-sm text-gray-600 font-medium">
            {hasHighlighting ? 'Loading and preparing highlights...' : 'Loading Wikipedia article...'}
          </div>
          <div className="text-xs text-gray-500">
            {isLocalUrl ? 'Loading from local cache' : 'Loading from Wikipedia'}
          </div>
          <div className="text-xs text-gray-400">
            Status: {loadingStatus}
          </div>
        </div>
      </div>
    </div>
  );

  // Error Component
  const ErrorState = () => (
    <div className="h-full w-full bg-white rounded-lg border border-red-200 overflow-hidden relative">
      <div className="flex items-center justify-center h-full text-center p-8">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load article</h3>
            <p className="text-gray-600 mb-4">Unable to load the Wikipedia article. This might be a network issue or the page might not be available locally.</p>
            <button
              onClick={handleOpenInNewTab}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Open on Wikipedia instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-white rounded-lg border border-[#f1f2f4] overflow-hidden relative">
      {/* External Link Icon */}
      {wikiUrl && (
        <button
          onClick={handleOpenInNewTab}
          className="absolute top-3 right-3 z-10 px-4 py-2 bg-blue-500/20 backdrop-blur-3xl hover:bg-blue-500/30 rounded-lg shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.5)] border border-blue-100/10 transition-all duration-200 flex items-center gap-2 font-medium"
          title="Open in new tab"
          aria-label="Open Wikipedia article in new tab"
        >
          <span className="text-sm text-gray-900 font-semibold">
            {isLocalUrl ? 'Open on Wikipedia' : 'Click to open on Wikipedia'}
          </span>
          <svg
            className="w-4 h-4 text-gray-900 hover:text-blue-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      )}

      {/* Status indicator for local content */}
      {isLocalUrl && !isLoading && !hasError && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <div className="px-3 py-1 bg-green-500/20 backdrop-blur-3xl rounded-lg border border-green-100/10 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-800 font-medium">Local Copy</span>
          </div>
          
          {/* Highlighting indicator with different styles for different match types */}
          {hasHighlighting && (
            <div className="px-3 py-1 backdrop-blur-3xl rounded-lg border flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">
                {/* We can't easily determine the match type from the frontend, so we'll use a generic indicator */}
                Text Highlighted
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      {!wikiUrl ? (
        <div className="flex items-center justify-center h-full text-[#60758a] text-sm">
          Select a reference to view the Wikipedia article
        </div>
      ) : hasError ? (
        <ErrorState />
      ) : isLoading ? (
        <LoadingShimmer />
      ) : (
        <iframe
          ref={iframeRef}
          src={finalUrl}
          className="w-full h-full border-0"
          title="Wikipedia Article"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
          loading="lazy"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </div>
  );
}
