"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from '@/hooks/useAnalytics';
import ImpactSection from './ImpactSection';
import Image from 'next/image';

interface PlatformStats {
  total_users: number;
  total_completed_tasks: number;
  total_points_awarded: number;
  average_points_per_user: number;
}

export default function Hero() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { trackClick, trackAction, trackPage } = useAnalytics();
  const router = useRouter();

  useEffect(() => {
    // Track page view
    trackPage('home');
    
    const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
    setIsLoggedIn(!!userData);
    if (userData?.name) {
      // Extract first name from full name
      const firstName = userData.name.split(' ')[0];
      setUserName(firstName);
      
      // Track returning user view
      trackAction('returning_user_home_view', {
        user_id: userData.id,
        user_name: firstName
      });
    } else {
      // Track new visitor
      trackAction('new_visitor_home_view', {});
    }
  }, [trackPage, trackAction]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/stats/platform`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleStartContributing = () => {
    if (isLoggedIn) {
      // Track logged in user starting task
      trackClick('start_new_task_button', {
        source: 'hero',
        user_logged_in: true,
        user_name: userName
      });
      
      // If logged in, go to a new task
      router.push('/tasks');
    } else {
      // Track login attempt from hero
      trackClick('start_contributing_button', {
        source: 'hero',
        user_logged_in: false,
        action: 'trigger_login'
      });
      
      // If not logged in, trigger Google login
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/auth/google/login`,
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for the login success message
      window.addEventListener('message', (event) => {
        if (event.origin === process.env.NEXT_PUBLIC_API_URL || event.origin === 'http://localhost:8001') {
          const userData = event.data;
          if (userData && userData.token) {
            localStorage.setItem('wikifacts_user', JSON.stringify(userData));
            setIsLoggedIn(true);
            
            // Track successful login from hero
            trackAction('login_success_from_hero', {
              user_id: userData.id,
              email: userData.email,
              source: 'hero_start_contributing'
            });
            
            router.push('/tasks/new');
          }
        }
      });
    }
  };

  const handleLearnMore = () => {
    trackClick('learn_how_it_works_button', {
      source: 'hero',
      user_logged_in: isLoggedIn,
      user_name: userName
    });
    
    router.push('/about');
  };

  // Calculate progress percentage (assuming 100 is the goal)
  const progressPercentage = stats ? Math.min((stats.total_completed_tasks / 100) * 100, 100) : 0;

  return (
    <>
      <section className="flex flex-col lg:flex-row gap-8 items-start justify-between w-full max-w-7xl mx-auto py-12 px-10 pt-10">
        {/* Left Side */}
        <div className="flex-1 min-w-[320px] max-w-xl">
          <div className="flex gap-3 mb-6">
            <span className="flex items-center gap-1">
              <Image
                src="/stanford_logo.png"
                alt="Stanford Logo"
                width={240}
                height={240}
                className="rounded-full"
              />
            </span>
          </div>
          <h1 className="text-5xl font-bold text-[#121416] mb-6 leading-tight tracking-tight">
            {userName ? `Hi ${userName}, Help Improve Wikipedia` : 'Help Improve Wikipedia'}
          </h1>
          <p className="text-lg text-[#121416] mb-8 font-normal">
            Join Stanford researchers in fixing millions of inconsistencies in Wikipedia. 
            Your contributions will directly improve the world&apos;s largest knowledge base 
            and earn you rewards for your impact.
          </p>
          <div className="rounded-2xl border border-[#f1f2f4] p-6 mb-6 bg-[#f1f2f4]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-[#121416]">Goal: Fix 100 Inconsistencies</span>
              <span className="text-xs text-[#121416] font-medium">{Math.round(progressPercentage)}% complete</span>
            </div>
            <div className="text-xs text-[#121416] mb-1 flex justify-between">
              <span>{stats?.total_completed_tasks || 0} tasks completed</span>
              <span>{stats?.total_points_awarded || 0} points earned</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-[#1ca152] rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1 text-[#121416]">
              {isLoading ? (
                'Loading community stats...'
              ) : (
                <>
                  Join {stats?.total_users || 0}+ contributors making a real impact on Wikipedia.
                </>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleStartContributing}
              className="bg-[#121416] text-white font-bold rounded-xl px-7 py-3 text-base hover:bg-[#23272f] transition"
            >
              {isLoggedIn ? 'Start New Task' : 'Start Contributing'}
            </button>
            <button 
              onClick={handleLearnMore}
              className="bg-white border border-[#121416] text-[#121416] font-semibold rounded-xl px-7 py-3 text-base hover:bg-[#f1f2f4] transition"
            >
              Learn How It Works
            </button>
          </div>
        </div>
        {/* Right Side */}
        <div className="flex-1 min-w-[320px] ml-20 mt-20">
          <Image 
            src="/hero.png"
            alt="Wikipedia Fact Checking"
            width={600}
            height={400}
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </section>
      
      {/* Impact Section */}
      <ImpactSection 
        totalContributors={stats?.total_users || 0}
        totalFixed={stats?.total_completed_tasks || 0}
      />
    </>
  );
}