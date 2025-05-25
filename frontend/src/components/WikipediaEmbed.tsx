import React from 'react';

interface WikipediaEmbedProps {
  wikiUrl: string;
  highlightText?: string;
}

export default function WikipediaEmbed({ wikiUrl, highlightText }: WikipediaEmbedProps) {
  const getHighlightedUrl = (url: string, text: string) => {
    if (!text) return url;
    // text = "at an extra cost of US$1.5 billion"
    const encodedText = encodeURIComponent(text);
    return `${url}#:~:text=${encodedText}`;
  };

  const finalUrl = highlightText ? getHighlightedUrl(wikiUrl, highlightText) : wikiUrl;

  const handleOpenInNewTab = () => {
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

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
          <span className="text-sm text-gray-900 font-semibold">Click to open on Wikipedia</span>
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

      {wikiUrl ? (
        <iframe
          src={finalUrl}
          className="w-full h-full border-0"
          title="Wikipedia Article"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-[#60758a] text-sm">
          Select a reference to view the Wikipedia article
        </div>
      )}
    </div>
  );
}
