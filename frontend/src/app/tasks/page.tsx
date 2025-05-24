"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TaskSkeleton from '@/components/TaskSkeleton';
import Split from 'react-split';

interface TaskData {
  id: string;
  text: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Open' | 'In Progress' | 'Completed';
  xp?: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  token: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// XP values for different difficulties
const XP_VALUES = {
  Easy: 10,
  Medium: 25,
  Hard: 50
};

export default function TasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndNavigateToRandomTask = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
        if (!userData?.token) {
          setError('Please log in to access tasks');
          return;
        }

        const response = await fetch(`${API_URL}/api/tasks/rand`, {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch random task');
        }
        const task: TaskData = await response.json();
        
        // Navigate to the random task
        router.push(`/tasks/${task.id}`);
      } catch (error) {
        console.error('Error fetching random task:', error);
        setError('Failed to load task. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndNavigateToRandomTask();
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