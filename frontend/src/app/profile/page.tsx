"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';

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
  claim: string;
  claim_text_span?: string;
  claim_url?: string;
  context: string;
  report?: string;
  report_urls?: string;
  agrees_with_claim: boolean;
  analysis: string;
  completed_at: string;
  points_earned: number;
}

interface PlatformStats {
  total_users: number;
  total_completed_tasks: number;
  total_points_awarded: number;
  average_points_per_user: number;
}

interface ReferralInfo {
  referral_code: string;
  referral_count: number;
  referral_link: string;
}

const topicsList = [
  { key: "science", name: "Science", icon: "/science.png" },
  { key: "history", name: "History", icon: "/history.png" },
  { key: "sports", name: "Sports", icon: "/sports.png" },
  { key: "technology", name: "Technology", icon: "/technology.png" },
  { key: "art", name: "Art", icon: "/art.png" },
  { key: "music", name: "Music", icon: "/music.png" },
  { key: "literature", name: "Literature", icon: "/literature.png" },
  { key: "geography", name: "Geography", icon: "/geography.png" },
];
const languagesList = [
  { code: "es", name: "Spanish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/59a90a2cedd48b751a8fd22014768fd7.svg" },
  { code: "fr", name: "French", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/482fda142ee4abd728ebf4ccce5d3307.svg" },
  { code: "ja", name: "Japanese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/edea4fa18ff3e7d8c0282de3f102aaed.svg" },
  { code: "de", name: "German", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/c71db846ffab7e0a74bc6971e34ad82e.svg" },
  { code: "ko", name: "Korean", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/ec5835ac9f465ff3dad4b1b8725d4314.svg" },
  { code: "it", name: "Italian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/635a09df9323279d39934a991edd4510.svg" },
  { code: "zh", name: "Chinese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/9905aa3a86fcb9e351b0b3bfaf04d8b9.svg" },
  { code: "hi", name: "Hindi", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/73837fa39dbf1bcc4c95a17a58ed0ffb.svg" },
  { code: "ru", name: "Russian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/eadd7804652170c33814a89482f1f353.svg" },
  { code: "ar", name: "Arabic", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/9ab6930a263c981b57f9d578ac97cae7.svg" },
  { code: "pt", name: "Portuguese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/27d253ae1272917fc9f4a79459aacd53.svg" },
  { code: "tr", name: "Turkish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/bc80a9518cd6d5af6ae14e8b22b8a1f4.svg" },
  { code: "en", name: "English", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/bbe17e16aa4a106032d8e3521eaed13e.svg" },
  { code: "nl", name: "Dutch", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/de945d789e249dcd74333a6996472ef8.svg" },
  { code: "el", name: "Greek", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/8db373482261397a3159d3f370eed2f3.svg" },
  { code: "vi", name: "Vietnamese", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/2b077d42185bc45d4896ed55f15c4fea.svg" },
  { code: "pl", name: "Polish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f095084e6ec400e631d62c3d95fefaa2.svg" },
  { code: "sv", name: "Swedish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f578430c9b7ab617c107893afbb501c0.svg" },
  { code: "la", name: "Latin", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f7cee6cc09270371b097129faf792c2a.svg" },
  { code: "ga", name: "Irish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/ef0bfb96037b127473bd7bcbfde1a6ed.svg" },
  { code: "no", name: "Norwegian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/90b37d97edc66e830dc2286279548f67.svg" },
  { code: "he", name: "Hebrew", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f818f545a703ddaa046ca8786e781742.svg" },
  { code: "val", name: "High Valyrian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/2880099b038848abbfd11104097953ad.svg" },
  { code: "uk", name: "Ukrainian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/7c6e12bc57527843082f7f5bb77c9862.svg" },
  { code: "id", name: "Indonesian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/339c0413e542f19b234971d7740447e7.svg" },
  { code: "ro", name: "Romanian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/357e13bb10cf86fc06552d563957e2e6.svg" },
  { code: "fi", name: "Finnish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/b4d0e4f6451f504e1441eb93efdbea5e.svg" },
  { code: "da", name: "Danish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/6af84a7cb8e99ea8a567c2b9c55b9926.svg" },
  { code: "cs", name: "Czech", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/828bf0fea457d3beaaab3d6c0bfcc975.svg" },
  { code: "zu", name: "Zulu", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/112e1531d0ac198a9424bd1b0a7166e6.svg" },
  { code: "haw", name: "Hawaiian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/312e21f793c555787d01a45e20ee8191.svg" },
  { code: "cy", name: "Welsh", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/f773f1b240623072e48843ecdf90d756.svg" },
  { code: "sw", name: "Swahili", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/335311988405b4354e1b6ae9037c02db.svg" },
  { code: "hu", name: "Hungarian", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/2ed8d0a73eab3c9cba0290e2b459684a.svg" },
  { code: "gd", name: "Scottish Gaelic", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/09eba3135efe8fe93a4662dba813b921.svg" },
  { code: "ht", name: "Haitian Creole", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/8cb302b44c183c1a8ec3b90caf90d922.svg" },
  { code: "eo", name: "Esperanto", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/6de7e4731b2a82a6458268e1a3d67ce4.svg" },
  { code: "tlh", name: "Klingon", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/76d654213a8282b0ebc25b4f535ee003.svg" },
  { code: "nv", name: "Navajo", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/bbc8ad0cfe2596d5193376ebdc3e969c.svg" },
  { code: "yi", name: "Yiddish", flag: "https://d35aaqx5ub95lt.cloudfront.net/vendor/55bad151fa6a8d9e2376fc9697c671c8.svg" },
];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInterests, setUserInterests] = useState<{ topics: string[]; languages: string[] }>({ topics: [], languages: [] });
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
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
          console.log('User Stats:', {
            points: statsData.points,
            rank: statsData.rank,
            completed_tasks: statsData.completed_tasks
          });
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

        // Fetch referral info
        const referralRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/users/${user.id}/referral`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (referralRes.ok) {
          const referralData = await referralRes.json();
          setReferralInfo(referralData);
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

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/users/${user.id}/interests`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUserInterests(data);
        }
      } catch (error) {
        console.error('Error fetching user interests:', error);
      }
    };
    fetchInterests();
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
            <div className="flex w-full gap-8">
              {/* Profile Picture with Cup Overlay */}
              <div className="relative min-h-32 w-32 flex-shrink-0">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full min-h-32 w-32"
                  style={{
                    backgroundImage: user.picture ? `url("${user.picture}")` : 'none',
                    backgroundColor: user.picture ? 'transparent' : '#f1f2f4'
                  }}
                />
                {stats && [1,2,3].includes(stats.rank) && (
                  <Image
                    src={`/cups/${stats.rank === 1 ? 'first' : stats.rank === 2 ? 'second' : 'third'}.png`}
                    alt={`Rank ${stats.rank}`}
                    width={56}
                    height={56}
                    className="absolute -bottom-3 -right-3 z-10"
                  />
                )}
              </div>
              
              {/* User Info and Interests */}
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-gray-900">
                      {user.name || user.email}
                    </p>
                    <div className="relative group">
                      <button
                        onClick={async () => {
                          if (referralInfo?.referral_link) {
                            try {
                              await navigator.clipboard.writeText(referralInfo.referral_link);
                              // Show feedback
                              const button = document.activeElement as HTMLButtonElement;
                              const originalText = button.textContent;
                              button.textContent = 'Copied!';
                              setTimeout(() => {
                                button.textContent = originalText;
                              }, 2000);
                            } catch (err) {
                              console.error('Failed to copy:', err);
                            }
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Invite Friends (+50 points)
                      </button>
                    </div>
                  </div>
                  {stats && (
                    <>
                      <p className="text-base font-normal leading-normal text-gray-600">
                        Verified Claims: {stats.completed_tasks} | Points: {stats.points}
                      </p>
                      <p className="text-base font-normal leading-normal text-gray-600">
                        Rank: {stats.rank}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Topics */}
                  {userInterests.topics.map((topic) => {
                    const t = topicsList.find(t => t.key === topic);
                    return (
                      <span key={topic} className="flex items-center bg-[#e6f4ea] text-[#1cb760] px-3 py-1 rounded-full text-sm font-medium gap-1">
                        {t?.icon && <Image src={t.icon} alt={t.name} width={20} height={20} className="w-5 h-5 mr-1 rounded-full" />}
                        {t?.name || topic}
                      </span>
                    );
                  })}
                  {/* Languages */}
                  {userInterests.languages.map((lang) => {
                    const l = languagesList.find(l => l.code === lang);
                    return (
                      <span key={lang} className="flex items-center bg-[#e6eaf4] text-[#1c4db7] px-3 py-1 rounded-full text-sm font-medium gap-1">
                        {l?.flag && <Image src={l.flag} alt={l.name} width={20} height={20} className="w-5 h-5 mr-1 rounded-full" />}
                        {l?.name || lang}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Verified Claims Section */}
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="flex-1">
                <thead>
                  <tr className="bg-white">
                    <th className="px-3 py-1.5 text-left text-gray-900 w-[400px] text-sm font-medium leading-normal">Task</th>
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
                          {task.claim}
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
          {/* <div className="flex px-4 py-3 justify-end">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-gray-100 text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-gray-200 transition-colors">
              <span className="truncate">View All Contributions</span>
            </button>
          </div> */}

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

          {/* Referred Users Section */}
          {/* <div className="mt-8 px-4">
            <h3 className="text-lg font-bold leading-tight tracking-[-0.015em] pb-2 text-gray-900">Referred Users</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">User</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Joined</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-900">Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {referredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-gray-200">
                      <td className="px-4 py-2 text-sm text-gray-900">{user.name || user.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {new Date(user.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">+{user.points_earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
} 