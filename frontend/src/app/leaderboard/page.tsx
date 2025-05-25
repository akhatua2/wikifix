"use client";
import React, { useEffect, useState } from "react";

interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  completed_tasks: number;
  rank: number;
}

interface LeaderboardData {
  total_users: number;
  user_rank: number;
  users: LeaderboardUser[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
    if (!userData) return;
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (error) {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">Leaderboard</h1>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse p-4 border-t border-gray-200 first:border-t-0">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))
          ) : leaderboard && (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Your Rank: <span className="font-bold text-gray-900">{leaderboard.user_rank}</span> of {leaderboard.total_users} users
                </p>
              </div>
              {leaderboard.users.map((user) => (
                <div key={user.id} className="p-4 border-b border-gray-200 last:border-b-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">#{user.rank}</span>
                    {([1,2,3].includes(user.rank)) && (
                      <img
                        src={`/cups/${user.rank === 1 ? 'first' : user.rank === 2 ? 'second' : 'third'}.png`}
                        alt={`Rank ${user.rank}`}
                        className="w-6 h-6 mr-1"
                      />
                    )}
                    <span className="text-sm text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user.completed_tasks} tasks</span>
                    <span className="text-sm font-medium text-gray-900">{user.points} pts</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 