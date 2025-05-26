"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  token: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Handle mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // On mount, check for user in localStorage (in case of redirect back)
  useEffect(() => {
    if (mounted) {
      const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
      if (userData) setUser(userData);
    }
  }, [mounted]);

  // If user logs in via Google, set user in localStorage and state
  useEffect(() => {
    if (!mounted) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key === "wikifacts_user") {
        const userData = JSON.parse(event.newValue || "null");
        if (userData) setUser(userData);
      } else if (event.key === "wikifacts_completed_tasks") {
        const count = JSON.parse(event.newValue || "0");
        setCompletedTasks(count);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [mounted]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!mounted) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen, mounted]);

  // Fetch completed tasks count for the user
  useEffect(() => {
    const fetchCompletedTasks = async () => {
      if (user && user.id) {
        try {
          const res = await fetch(`${API_URL}/api/users/${user.id}/completed-tasks`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setCompletedTasks(data.total_completed || 0);
          }
        } catch {
          setCompletedTasks(0);
        }
      }
    };
    fetchCompletedTasks();
  }, [user]);

  // Fetch user rank for cup overlay
  useEffect(() => {
    const fetchRank = async () => {
      if (user && user.id && user.token) {
        try {
          const res = await fetch(`${API_URL}/api/users/${user.id}/stats`, {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setUserRank(data.rank);
          }
        } catch {
          setUserRank(null);
        }
      }
    };
    fetchRank();
  }, [user]);

  const handleGoogleLogin = () => {
    const popup = window.open(
      `${API_URL}/auth/google/login`,
      "googleLogin",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );
  
    if (!popup) {
      alert('Popup blocked. Please allow popups for this site.');
      return;
    }
  
    const messageHandler = (event: MessageEvent) => {
      // Critical: Validate origin to prevent security issues
      const expectedOrigin = new URL(API_URL).origin;
      if (event.origin !== expectedOrigin) {
        console.log('Ignoring message from unexpected origin:', event.origin);
        return;
      }
      
      // Check for valid user data with all required fields
      if (event.data?.email && event.data?.token && event.data?.id) {
        console.log('Received valid user data:', event.data);
        localStorage.setItem("wikifacts_user", JSON.stringify(event.data));
        setUser(event.data);
        
        // Redirect if user needs onboarding
        if (event.data.needs_onboarding) {
          window.location.href = '/onboarding/topics';
        }
        
        // Clean up
        cleanup();
      } else if (event.data?.error) {
        console.error('OAuth error:', event.data.error);
        alert('Login failed. Please try again.');
        cleanup();
      }
    };
  
    const cleanup = () => {
      window.removeEventListener("message", messageHandler);
      if (popup && !popup.closed) {
        popup.close();
      }
      if (checkClosedInterval) {
        clearInterval(checkClosedInterval);
      }
    };
  
    // Add the message listener (without { once: true })
    window.addEventListener("message", messageHandler);
    
    // Monitor if popup is manually closed
    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        console.log('Popup was closed manually');
        cleanup();
      }
    }, 1000);
  
    // Timeout after 5 minutes
    setTimeout(() => {
      if (!popup.closed) {
        console.log('Login timeout');
        cleanup();
      }
    }, 300000);
  };
  

  const handleLogout = async () => {
    try {
      if (user?.token) {
        await fetch(`${API_URL}/auth/logout`, { 
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local state and storage regardless of server response
      localStorage.removeItem("wikifacts_user");
      setUser(null);
      setDropdownOpen(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <header className="bg-white">
      <div className="flex items-center justify-between whitespace-nowrap px-10 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 text-[#121416]">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                  fill="currentColor"
                ></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          <Link href="/" className="flex items-center gap-4">
            <h2 className="text-[#121416] text-lg font-bold leading-tight tracking-[-0.015em]">WikiFix</h2>
          </Link>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-9">
            <Link 
              className={`text-sm font-medium leading-normal ${
                isActive('/') ? 'text-[#121416]' : 'text-[#60758a] hover:text-[#121416]'
              }`} 
              href="/"
            >
              Home
            </Link>
            {user && (
              <Link 
                className={`text-sm font-medium leading-normal ${
                  isActive('/tasks') ? 'text-[#121416]' : 'text-[#60758a] hover:text-[#121416]'
                }`} 
                href="/tasks"
              >
                Tasks
              </Link>
            )}
            <Link 
              className={`text-sm font-medium leading-normal ${
                isActive('/about') ? 'text-[#121416]' : 'text-[#60758a] hover:text-[#121416]'
              }`} 
              href="/about"
            >
              About
            </Link>
            <Link 
              className={`text-sm font-medium leading-normal ${
                isActive('/leaderboard') ? 'text-[#121416]' : 'text-[#60758a] hover:text-[#121416]'
              }`} 
              href="/leaderboard"
            >
              Leaderboard
            </Link>
          </div>
          <div className="flex gap-4 items-center">
            {/* Completed Tasks Bar */}
            {user && (
              <div className="flex items-center gap-2 min-w-[120px]">
                <div className="flex flex-col items-end">
                  <div className="w-24 h-2 bg-[#f1f2f4] rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-[#1ca152] rounded-full transition-all"
                      style={{ width: `${Math.min(completedTasks, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#1ca152] ml-1">{completedTasks}</span>
              </div>
            )}
            {/* Profile/Login Buttons */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center gap-2">
                  <Link href="/profile" className="focus:outline-none relative">
                    {user.picture && (
                      <>
                        <Image 
                          src={user.picture} 
                          alt="Profile" 
                          width={32} 
                          height={32} 
                          className="rounded-full hover:ring-2 hover:ring-gray-200 transition-all" 
                        />
                        {userRank && [1,2,3].includes(userRank) && (
                          <Image
                            src={`/cups/${userRank === 1 ? 'first' : userRank === 2 ? 'second' : 'third'}.png`}
                            alt={`Rank ${userRank}`}
                            width={24}
                            height={24}
                            className="absolute w-6 h-6 -bottom-2 -right-2 z-10"
                          />
                        )}
                      </>
                    )}
                  </Link>
                  <button
                    className="flex items-center gap-2 focus:outline-none"
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="px-4 py-2 text-sm text-[#121416] font-bold border-b border-gray-100">{user.name || user.email}</div>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-[#a52828] hover:bg-[#f1f2f4] rounded-b-xl"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#dce8f3] text-[#121416] text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={handleGoogleLogin}
                >
                  <span className="truncate">Join</span>
                </button>
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 px-4 bg-[#f1f2f4] text-[#121416] text-sm font-bold leading-normal tracking-[0.015em]"
                  onClick={handleGoogleLogin}
                >
                  <span className="truncate">Log in</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}