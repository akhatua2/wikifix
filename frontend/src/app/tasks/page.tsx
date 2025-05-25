"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TaskData, fetchRandomTask } from '@/types/task';

export default function TasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndNavigateToRandomTask = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
        if (!userData?.token) {
          setError('Please log in to access tasks');
          return;
        }

        const task = await fetchRandomTask(userData.token);
        
        // Navigate to the random task
        router.push(`/tasks/${task.id}`);
      } catch (error) {
        console.error('Error fetching random task:', error);
        setError('Failed to load task. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadAndNavigateToRandomTask();
  }, [router]);

  if (loading) {
    return null; // Don't show any loading state, just wait for navigation
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#a52828] text-lg">{error}</p>
      </div>
    );
  }

  // This return statement is just a fallback and should never be reached
  // since we either navigate away or show loading/error states
  return null;
} 