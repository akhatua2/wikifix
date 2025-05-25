"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';

const topics = [
  { key: "science", name: "Science", icon: "/science.png" },
  { key: "history", name: "History", icon: "/history.png" },
  { key: "sports", name: "Sports", icon: "/sports.png" },
  { key: "technology", name: "Technology", icon: "/technology.png" },
  { key: "art", name: "Art", icon: "/art.png" },
  { key: "music", name: "Music", icon: "/music.png" },
  { key: "literature", name: "Literature", icon: "/literature.png" },
  { key: "geography", name: "Geography", icon: "/geography.png" },
];

const steps = ["Topics", "Language", "Finish"];

export default function TopicsOnboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [otherTopics, setOtherTopics] = useState("");
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const router = useRouter();

  const toggleTopic = (key: string) => {
    setSelected((prev) => {
      const newSelected = prev.includes(key) 
        ? prev.filter((k) => k !== key) 
        : [...prev, key];
      
      // Save to localStorage
      localStorage.setItem("wikifacts_topics", JSON.stringify([...newSelected, ...customTopics]));
      
      return newSelected;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const topic = otherTopics.trim();
      if (topic && !customTopics.includes(topic)) {
        const newCustomTopics = [...customTopics, topic];
        setCustomTopics(newCustomTopics);
        // Save to localStorage
        localStorage.setItem("wikifacts_topics", JSON.stringify([...selected, ...newCustomTopics]));
        setOtherTopics("");
      }
    }
  };

  const removeCustomTopic = (topic: string) => {
    const newCustomTopics = customTopics.filter(t => t !== topic);
    setCustomTopics(newCustomTopics);
    // Save to localStorage
    localStorage.setItem("wikifacts_topics", JSON.stringify([...selected, ...newCustomTopics]));
  };

  // Load saved topics on mount
  useEffect(() => {
    const savedTopics = JSON.parse(localStorage.getItem("wikifacts_topics") || "[]");
    // Split saved topics into predefined and custom
    const predefinedTopics = savedTopics.filter((topic: string) => 
      topics.some(t => t.key === topic)
    );
    const customTopics = savedTopics.filter((topic: string) => 
      !topics.some(t => t.key === topic)
    );
    setSelected(predefinedTopics);
    setCustomTopics(customTopics);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f6] px-4 py-8 relative">
      {/* Progress Tracker */}
      <div className="flex items-center justify-center mb-8 mt-2">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all
                ${idx === 0 ? 'bg-[#1cb760] border-[#1cb760] text-white' : 'bg-white border-[#d3d3d3] text-[#bdbdbd]'}
              `}
            >
              {idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className="w-10 h-1 bg-[#e5e5e5] mx-2 rounded" />
            )}
          </div>
        ))}
      </div>
      <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold mb-6 text-center text-black" style={{letterSpacing: '-0.02em'}}>What topics are you interested in?</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-2xl">
        {topics.map((topic) => (
          <button
            key={topic.key}
            className={`bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 transition hover:scale-105 focus:outline-none ${selected.includes(topic.key) ? 'border-[#1cb760] shadow-lg' : 'border-transparent'}`}
            onClick={() => toggleTopic(topic.key)}
          >
            <Image src={topic.icon} alt={topic.name} className="w-16 h-16 mb-2 rounded" />
            <span className="font-semibold text-lg mb-1 text-[#bdbdbd]">{topic.name}</span>
          </button>
        ))}
      </div>
      {/* Other topics input */}
      <div className="w-full max-w-2xl mb-8">
        <label htmlFor="other-topics" className="block text-base font-semibold mb-2 text-[#555]">Other topics (optional)</label>
        <div className="relative">
          <textarea
            id="other-topics"
            className="w-full rounded-lg border border-[#e5e5e5] p-3 text-base text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#1cb760] bg-white shadow"
            rows={2}
            placeholder="Type a topic and press Enter to add it..."
            value={otherTopics}
            onChange={e => setOtherTopics(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          {customTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {customTopics.map((topic) => (
                <div
                  key={topic}
                  className="bg-[#1cb760] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {topic}
                  <button
                    onClick={() => removeCustomTopic(topic)}
                    className="hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Chevron Navigation */}
      {/* Left chevron is hidden/disabled on first step */}
      <button
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-3 flex items-center justify-center border border-[#e5e5e5] opacity-0 cursor-default z-50"
        aria-label="Back"
        tabIndex={-1}
        disabled
        style={{ pointerEvents: 'none' }}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-[#1cb760] text-white rounded-full shadow p-3 flex items-center justify-center border border-[#1cb760] hover:bg-[#169c4a] disabled:opacity-50 z-50"
        aria-label="Next"
        disabled={selected.length === 0}
        onClick={() => router.push('/onboarding/language')}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
} 