import React, { useState, useCallback, useRef, useEffect } from 'react';

interface WikipediaEmbedProps {
  wikiUrl: string;
}

export default function WikipediaEmbed({ wikiUrl }: WikipediaEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getOpenInNewTabUrl = (url: string) => {
    // For highlighted content URLs, extract the original Wikipedia page
    if (url.includes('/api/wiki-highlighted/')) {
      // These are pre-highlighted content, open generic Wikipedia
      return 'https://en.wikipedia.org';
    }
    
    // For other local URLs, try to extract the page name
    if (url.startsWith('/api/wiki/')) {
      const pageName = url.replace('/api/wiki/', '').split('?')[0];
      return `https://en.wikipedia.org/wiki/${pageName}`;
    }
    
    // External URLs use as-is
    return url;
  };

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  const handleLoadingError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // Reset loading state when URL changes
  useEffect(() => {
    if (wikiUrl) {
      setIsLoading(true);
      setHasError(false);
      
      // Clear any existing timer
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Fallback timeout - assume loaded after reasonable time
      loadingTimeoutRef.current = setTimeout(() => {
        handleLoadingComplete();
      }, 5000); // 5 second timeout
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [wikiUrl, handleLoadingComplete]);

  const newTabUrl = getOpenInNewTabUrl(wikiUrl);
  const isHighlightedContent = wikiUrl.includes('/api/wiki-highlighted/');

  function handleOpenInNewTab() {
    window.open(newTabUrl, '_blank', 'noopener,noreferrer');
  }

  // Loading Component
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
      </div>
      
      {/* Loading indicator overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="text-sm text-gray-600 font-medium">
            {isHighlightedContent ? 'Loading highlighted content...' : 'Loading Wikipedia article...'}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load content</h3>
            <p className="text-gray-600 mb-4">Unable to load the content. This might be a network issue.</p>
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
            Open on Wikipedia
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

      {/* Content Area */}
      {!wikiUrl ? (
        <div className="flex items-center justify-center h-full text-[#60758a] text-sm">
          No content to display
        </div>
      ) : hasError ? (
        <ErrorState />
      ) : isLoading ? (
        <LoadingShimmer />
      ) : (
        <iframe
          ref={iframeRef}
          src={wikiUrl}
          className="w-full h-full border-0"
          title="Wikipedia Content"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
          loading="lazy"
          onLoad={handleLoadingComplete}
          onError={handleLoadingError}
        />
      )}
    </div>
  );
}
