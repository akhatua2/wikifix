"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  token: string;
}

interface UserStats {
  points: number;
  completed_tasks: number;
  badges: number;
  rank: number;
}

interface CompletedTask {
  id: string;
  text: string;
  agrees_with_claim: boolean;
  analysis: string;
  completed_at: string;
  points_earned: number;
}

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

interface PlatformStats {
  total_users: number;
  total_completed_tasks: number;
  total_points_awarded: number;
  average_points_per_user: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
    if (!userData) {
      router.push('/'); // Redirect to home if not logged in
      return;
    }
    setUser(userData);
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch user stats
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/users/${user.id}/stats`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch completed tasks
        const tasksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/users/${user.id}/completed-tasks/list`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setCompletedTasks(tasksData);
        }

        // Fetch leaderboard
        const leaderboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          setLeaderboard(leaderboardData);
        }

        // Fetch platform stats
        const platformStatsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/stats/platform`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (platformStatsRes.ok) {
          const platformStatsData = await platformStatsRes.json();
          setPlatformStats(platformStatsData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[960px] flex-1">
          {/* Profile Header */}
          <div className="flex p-4">
            <div className="flex w-full flex-col gap-4 items-center">
              <div className="flex gap-4 flex-col items-center">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32"
                  style={{
                    backgroundImage: user.picture ? `url("${user.picture}")` : 'none',
                    backgroundColor: user.picture ? 'transparent' : '#f1f2f4'
                  }}
                />
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-center text-gray-900">
                    {user.name || user.email}
                  </p>
                  {stats && (
                    <>
                      <p className="text-base font-normal leading-normal text-center text-gray-600">
                        Verified Claims: {stats.completed_tasks} | Points: {stats.points} | Badges: {stats.badges}
                      </p>
                      <p className="text-base font-normal leading-normal text-center text-gray-600">
                        Rank: {stats.rank}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] w-full max-w-[480px] hover:bg-gray-200 transition-colors">
                <span className="truncate">Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="pb-3">
            <div className="flex border-b border-gray-200 px-4">
              <a className="flex flex-col items-center justify-center border-b-[3px] border-b-gray-900 text-gray-900 pb-[13px] pt-4" href="#">
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">Contributions</p>
              </a>
            </div>
          </div>

          {/* Verified Claims Section */}
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="flex-1">
                <thead>
                  <tr className="bg-white">
                    <th className="px-3 py-1.5 text-left text-gray-900 w-[400px] text-sm font-medium leading-normal">Claim</th>
                    <th className="px-3 py-1.5 text-right text-gray-900 w-32 text-sm font-medium leading-normal">Status</th>
                    <th className="px-3 py-1.5 text-right text-gray-900 w-32 text-sm font-medium leading-normal">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    // Skeleton loading rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-t border-gray-200 animate-pulse">
                        <td className="h-8 px-3 py-1.5 w-[400px]">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </td>
                        <td className="h-8 px-3 py-1.5 w-32 text-right">
                          <div className="h-3 bg-gray-200 rounded w-20 ml-auto"></div>
                        </td>
                        <td className="h-8 px-3 py-1.5 w-32 text-right">
                          <div className="h-3 bg-gray-200 rounded w-24 ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : completedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="h-8 px-3 py-1.5 text-center text-gray-600">
                        No verified claims yet. Start contributing to see your claims here!
                      </td>
                    </tr>
                  ) : (
                    completedTasks.map((task) => (
                      <tr key={task.id} className="border-t border-gray-200">
                        <td className="h-8 px-3 py-1.5 w-[400px] text-gray-900 text-sm font-normal leading-normal">
                          {task.text}
                        </td>
                        <td className="h-8 px-3 py-1.5 w-32 text-right">
                          <button className="inline-flex items-center justify-center overflow-hidden rounded h-5 px-2 bg-gray-100 text-gray-900 text-xs font-medium leading-normal hover:bg-gray-200 transition-colors">
                            <span className="truncate">
                              {task.agrees_with_claim ? 'Agreed' : 'Disagreed'} (+{task.points_earned})
                            </span>
                          </button>
                        </td>
                        <td className="h-8 px-3 py-1.5 w-32 text-gray-600 text-sm font-normal leading-normal text-right">
                          {new Date(task.completed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* View All Button */}
          <div className="flex px-4 py-3 justify-end">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 transition-colors">
              <span className="truncate">View All Contributions</span>
            </button>
          </div>

          {/* Platform Stats Section */}
          <div className="mt-8 px-4">
            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] pb-2 text-gray-900">Platform Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded-lg"></div>
                  </div>
                ))
              ) : platformStats && (
                <>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.total_users}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Tasks Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.total_completed_tasks}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total Points Awarded</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.total_points_awarded}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Avg Points/User</p>
                    <p className="text-2xl font-bold text-gray-900">{platformStats.average_points_per_user}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="mt-8 px-4">
            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] pb-2 text-gray-900">Leaderboard</h3>
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

          {/* Badges Section */}
          <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4 text-gray-900">Badges</h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
            {isLoading ? (
              // Skeleton loading for badges
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                </div>
              ))
            ) : stats?.badges === 0 ? (
              <div className="col-span-full text-center text-gray-600 py-4">
                No badges yet. Keep contributing to earn badges!
              </div>
            ) : (
              <div className="col-span-full text-center text-gray-600 py-4">
                Loading your badges...
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center underline cursor-pointer hover:text-gray-900">
            View full leaderboard
          </p>
        </div>
      </div>
    </div>
  );
} 