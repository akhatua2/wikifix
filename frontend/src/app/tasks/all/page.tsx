"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TaskData {
  id: string;
  text: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Open' | 'In Progress' | 'Completed';
  xp?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

// XP values for different difficulties
const XP_VALUES = {
  Easy: 10,
  Medium: 25,
  Hard: 50
};

export default function AllTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
        if (!userData?.token) {
          setError('Please log in to access tasks');
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_URL}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        const data = await response.json();
        // Add XP values to tasks
        const tasksWithXP = data.map((task: TaskData) => ({
          ...task,
          xp: XP_VALUES[task.difficulty]
        }));
        setTasks(tasksWithXP);
        setError(null);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleStartTask = (id: string) => {
    router.push(`/tasks/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#121416] text-lg">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#a52828] text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-10 w-full py-5">
        <h1 className="text-[#121416] text-2xl font-bold mb-6">All Tasks</h1>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-[#121416]">
              No tasks available
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id}
                className="bg-white rounded-xl border border-[#f1f2f4] p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => handleStartTask(task.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                      task.difficulty === 'Easy' ? 'bg-[#dce8f3] text-[#121416]' :
                      task.difficulty === 'Medium' ? 'bg-[#dce8f3] text-[#121416]' :
                      'bg-[#dce8f3] text-[#121416]'
                    }`}>
                      {task.difficulty}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-[#dce8f3] text-[#121416] text-sm font-medium">
                      +{task.xp} XP
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                    task.status === 'Open' ? 'bg-[#dce8f3] text-[#121416]' :
                    task.status === 'In Progress' ? 'bg-[#dce8f3] text-[#121416]' :
                    'bg-[#1ca152] text-white'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-[#121416] text-base mb-3">{task.text}</p>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 rounded-lg bg-[#f1f2f4] text-[#121416] text-sm">
                    {task.topic}
                  </span>
                  <button className="px-4 py-2 bg-[#dce8f3] text-[#121416] rounded-xl text-sm font-medium hover:bg-[#f1f2f4] transition-colors">
                    Start Task
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 