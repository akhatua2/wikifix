"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from '@/hooks/useAnalytics';
import dynamic from "next/dynamic";

const ReactConfetti = dynamic(() => import("react-confetti"), { ssr: false });

export default function FinishOnboarding() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { trackClick, trackAction, trackPage } = useAnalytics();
  const router = useRouter();
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track page view on mount
  useEffect(() => {
    trackPage('onboarding/finish');
  }, [trackPage]);

  useEffect(() => {
    const saveInterests = async () => {
      try {
        setIsSaving(true);
        setError(null);

        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
        if (!userData?.id || !userData?.token) {
          throw new Error("User not logged in");
        }

        // Get interests from localStorage
        const topics = JSON.parse(localStorage.getItem("wikifacts_topics") || "[]");
        const languages = JSON.parse(localStorage.getItem("wikifacts_languages") || "[]");

        // Track onboarding completion attempt
        trackAction('onboarding_save_attempt', {
          user_id: userData.id,
          selected_topics: topics,
          selected_languages: languages,
          total_topics: topics.length,
          total_languages: languages.length
        });

        // Save to backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${userData.id}/interests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userData.token}`
          },
          body: JSON.stringify({
            topics,
            languages
          })
        });

        if (!response.ok) {
          throw new Error("Failed to save interests");
        }

        // Track successful onboarding completion
        trackAction('onboarding_completed', {
          user_id: userData.id,
          selected_topics: topics,
          selected_languages: languages,
          total_topics: topics.length,
          total_languages: languages.length
        });

        // Clear onboarding data from localStorage
        localStorage.removeItem("wikifacts_topics");
        localStorage.removeItem("wikifacts_languages");

        // Do not auto-redirect. Just set a success state.
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        
        // Track onboarding failure
        trackAction('onboarding_save_failed', {
          error: err instanceof Error ? err.message : "Unknown error"
        });
      } finally {
        setIsSaving(false);
      }
    };

    saveInterests();
  }, [router, trackAction]);

  // Handle start task button click
  const handleStartTask = () => {
    trackClick('onboarding_start_task_button', {
      onboarding_completed: success,
      saving_state: isSaving ? 'saving' : 'complete'
    });
    
    router.push('/tasks');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f6] px-4 py-8 relative overflow-hidden">
      <ReactConfetti width={windowSize.width} height={windowSize.height} numberOfPieces={350} recycle={false} />
      <div className="flex flex-col items-center z-10">
        <h1 className="text-[2.2rem] md:text-[2.7rem] font-extrabold mb-4 text-center text-black" style={{letterSpacing: '-0.02em'}}>
          {isSaving ? "Saving your preferences..." : success ? "All set!" : "All set!"}
        </h1>
        <p className="text-lg text-center mb-8 text-[#555] max-w-md">
          {error ? error : success ? "Your interests have been saved! You're now part of a global movement to make knowledge more reliable for everyone. Ready to make your first impact?" : "You're now part of a global movement to make knowledge more reliable for everyone. Ready to make your first impact?"}
        </p>
        <button
          className="bg-[#1cb760] text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#169c4a] transition-colors shadow-lg"
          onClick={handleStartTask}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Start working on a task"}
        </button>
      </div>
    </div>
  );
} 