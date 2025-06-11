"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from '@/hooks/useAnalytics';

const steps = ["Topics", "Language", "Username", "Finish"];

interface UsernameValidationResult {
  valid: boolean;
  exists: boolean;
  message: string;
}

export default function UsernameOnboarding() {
  const [username, setUsername] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<UsernameValidationResult | null>(null);
  const [skipWikipedia, setSkipWikipedia] = useState(false);
  const { trackClick, trackInputDebounced, trackPage, trackAction } = useAnalytics();
  const router = useRouter();

  // Track page view on mount
  useEffect(() => {
    trackPage('onboarding/username');
  }, [trackPage]);

  // Validate Wikipedia username
  const validateUsername = async (username: string): Promise<UsernameValidationResult> => {
    if (!username.trim()) {
      return { valid: false, exists: false, message: "Please enter a username" };
    }

    try {
      // Check if username exists on Wikipedia using their API
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=users&ususers=${encodeURIComponent(username)}&format=json&origin=*`
      );
      
      const data = await response.json();
      const user = data.query?.users?.[0];
      
      if (user?.missing) {
        return { 
          valid: false, 
          exists: false, 
          message: "This username doesn't exist on Wikipedia" 
        };
      } else if (user?.invalid) {
        return { 
          valid: false, 
          exists: false, 
          message: "This is not a valid Wikipedia username format" 
        };
              } else if (user?.userid) {
        return { 
          valid: true, 
          exists: true, 
          message: "✓ Account verified" 
        };
      } else {
        return { 
          valid: false, 
          exists: false, 
          message: "Unable to verify this username" 
        };
      }
    } catch (error) {
      return { 
        valid: false, 
        exists: false, 
        message: "Error checking username. You can skip this step if needed." 
      };
    }
  };

  // Handle username input change with debounced validation
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setValidationResult(null);
    
    // Track input with debouncing
    trackInputDebounced('wikipedia_username_input', value, {
      step: 'username_onboarding',
      length: value.length
    });

    // Validate after user stops typing
    if (value.trim()) {
      const timeoutId = setTimeout(async () => {
        setIsValidating(true);
        const result = await validateUsername(value);
        setValidationResult(result);
        setIsValidating(false);
        
        // Track validation result
        trackAction('username_validation', {
          username_length: value.length,
          validation_result: result.valid ? 'valid' : 'invalid',
          exists_on_wikipedia: result.exists,
          step: 'username_onboarding'
        });
      }, 800);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Handle skip option
  const handleSkipToggle = () => {
    const newSkipState = !skipWikipedia;
    setSkipWikipedia(newSkipState);
    
    trackAction('skip_wikipedia_username', {
      action: newSkipState ? 'enable_skip' : 'disable_skip',
      had_username_entered: username.length > 0,
      step: 'username_onboarding'
    });
    
    if (newSkipState) {
      setUsername("");
      setValidationResult(null);
    }
  };

  // Handle navigation
  const handleBack = () => {
    trackClick('onboarding_back_button', {
      step: 'username',
      username_entered: username.length > 0,
      validation_status: validationResult?.valid ? 'valid' : 'invalid',
      skip_enabled: skipWikipedia
    });
    
    router.push('/onboarding/language');
  };

  const handleNext = () => {
    // Save username to localStorage if provided and valid
    if (!skipWikipedia && username && validationResult?.valid) {
      localStorage.setItem("wikifacts_wikipedia_username", username);
    } else {
      localStorage.removeItem("wikifacts_wikipedia_username");
    }
    
    trackClick('onboarding_next_button', {
      step: 'username',
      username_provided: !!username,
      username_valid: validationResult?.valid || false,
      skipped_wikipedia: skipWikipedia
    });
    
    router.push('/onboarding/finish');
  };

  // Load saved username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("wikifacts_wikipedia_username");
    if (savedUsername) {
      setUsername(savedUsername);
      // Validate saved username
      validateUsername(savedUsername).then(result => {
        setValidationResult(result);
      });
    }
  }, []);

  const canProceed = skipWikipedia || (username && validationResult?.valid);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f6f6] px-4 py-8 relative">
      {/* Progress Tracker */}
      <div className="flex items-center justify-center mb-8 mt-2">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all
                ${idx === 2 ? 'bg-[#1cb760] border-[#1cb760] text-white' : 'bg-white border-[#d3d3d3] text-[#bdbdbd]'}
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
      
      <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold mb-4 text-center text-black" style={{letterSpacing: '-0.02em'}}>
        What's your Wikipedia username?
      </h1>
      
      <div className="w-full max-w-md mb-6">
        <div className="relative">
          <input
            id="wikipedia-username"
            type="text"
            className="w-full rounded-lg border border-[#e5e5e5] p-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1cb760] bg-white shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="Enter your Wikipedia username"
            value={username}
            onChange={handleUsernameChange}
            disabled={skipWikipedia}
          />
                     {validationResult && (
             <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
               {validationResult.valid ? (
                 <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
               ) : (
                 <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                 </svg>
               )}
             </div>
           )}
        </div>
        
                 
      </div>

      {/* Skip option */}
      <div className="flex items-center mb-8">
        <input
          type="checkbox"
          id="skip-wikipedia"
          checked={skipWikipedia}
          onChange={handleSkipToggle}
          className="mr-3 h-4 w-4 text-[#1cb760] focus:ring-[#1cb760] border-gray-300 rounded"
        />
        <label htmlFor="skip-wikipedia" className="text-base text-[#555]">
          Skip this step
        </label>
      </div>

      {skipWikipedia && (
        <div className="text-center text-sm text-[#777] mb-8 max-w-md">
          No problem! You can add this later if you'd like.
        </div>
      )}

      {/* Chevron Navigation */}
      <button
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full shadow p-3 flex items-center justify-center border border-[#e5e5e5] hover:bg-[#f0f0f0] z-50"
        aria-label="Back"
        onClick={handleBack}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-[#1cb760] text-white rounded-full shadow p-3 flex items-center justify-center border border-[#1cb760] hover:bg-[#169c4a] disabled:opacity-50 disabled:cursor-not-allowed z-50"
        aria-label="Next"
        disabled={!canProceed}
        onClick={handleNext}
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
} 