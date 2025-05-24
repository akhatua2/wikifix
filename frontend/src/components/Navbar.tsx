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

  const handleGoogleLogin = () => {
    const popup = window.open(
      `${API_URL}/auth/google/login`,
      "googleLogin",
      "width=500,height=600"
    );
  
    window.addEventListener("message", (event) => {
      if (event.data?.email) {
        localStorage.setItem("wikifacts_user", JSON.stringify(event.data));
        setUser(event.data);
        popup?.close();
      }
    }, { once: true });
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
          <Link href="/" className="flex items-center gap-4">
            <div className="size-4">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_6_535)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z"
                    fill="currentColor"
                  ></path>
                </g>
                <defs>
                  <clipPath id="clip0_6_535"><rect width="48" height="48" fill="white"></rect></clipPath>
                </defs>
              </svg>
            </div>
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
            <Link 
              className={`text-sm font-medium leading-normal ${
                isActive('/tasks') ? 'text-[#121416]' : 'text-[#60758a] hover:text-[#121416]'
              }`} 
              href="/tasks"
            >
              Tasks
            </Link>
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
                isActive('/community') ? 'text-[#121416]' : 'text-[#60758a] hover:text-[#121416]'
              }`} 
              href="/community"
            >
              Community
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
                  <Link href="/profile" className="focus:outline-none">
                    {user.picture && (
                      <Image 
                        src={user.picture} 
                        alt="Profile" 
                        width={32} 
                        height={32} 
                        className="rounded-full hover:ring-2 hover:ring-gray-200 transition-all" 
                      />
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