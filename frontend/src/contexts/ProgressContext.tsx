"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProgressContextType {
  completedTasks: number;
  updateCompletedTasks: (count: number) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completedTasks, setCompletedTasks] = useState<number>(0);

  // Initialize completed tasks count from localStorage
  useEffect(() => {
    const count = JSON.parse(localStorage.getItem('wikifacts_completed_tasks') || '0');
    setCompletedTasks(count);
  }, []);

  // Listen for storage events to update completed tasks
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'wikifacts_completed_tasks') {
        const count = JSON.parse(event.newValue || '0');
        setCompletedTasks(count);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateCompletedTasks = (count: number) => {
    setCompletedTasks(count);
    localStorage.setItem('wikifacts_completed_tasks', JSON.stringify(count));
  };

  return (
    <ProgressContext.Provider value={{ completedTasks, updateCompletedTasks }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
} 