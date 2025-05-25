import React from 'react';
import { FaTrophy, FaWikipediaW, FaCheckCircle } from 'react-icons/fa';

interface ImpactSectionProps {
  totalContributors: number;
  totalFixed: number;
}

// SVG icons for steps
const StepIcons = [
  // Step 1: Magnifying glass
  <svg key="1" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-3 text-[#1ca152]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="7" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>,
  // Step 2: Checklist
  <svg key="2" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-3 text-[#1ca152]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>,
  // Step 3: Wikipedia W (document with arrow)
  <svg key="3" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-3 text-[#1ca152]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 16l2-6 2 4 2-4 2 6"/></svg>,
  // Step 4: Trophy
  <svg key="4" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-3 text-[#1ca152]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M17 5V3H7v2M5 5v2a7 7 0 0014 0V5"/></svg>
];

export default function ImpactSection({ totalContributors, totalFixed }: ImpactSectionProps) {
  return (
    <div className="w-full bg-[#f8f9fa] py-16">
      <div className="max-w-7xl mx-auto px-10">
        <h2 className="text-3xl font-bold text-center mb-12 text-[#121416]">Be Part of the Wikipedia Improvement Movement</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Impact Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="text-[#1ca152] text-4xl mb-4">
              <FaWikipediaW />
            </div>
            <h3 className="text-xl font-bold mb-4 text-[#121416]">Real Impact on Wikipedia</h3>
            <p className="text-gray-700">
              Every inconsistency you verify gets reviewed by our team and submitted to Wikipedia for correction. 
              Your contributions directly improve the world's largest knowledge base.
            </p>
            <div className="mt-4 text-sm text-gray-600">
              <span className="font-semibold">{totalFixed.toLocaleString()}</span> inconsistencies fixed so far
            </div>
          </div>

          {/* Community Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="text-[#1ca152] text-4xl mb-4">
              <FaCheckCircle />
            </div>
            <h3 className="text-xl font-bold mb-4 text-[#121416]">Join a Global Community</h3>
            <p className="text-gray-700">
              Work alongside {totalContributors.toLocaleString()}+ contributors worldwide who are passionate about 
              making knowledge more accurate and accessible for everyone.
            </p>
            <div className="mt-4 text-sm text-gray-600">
              <span className="font-semibold">24/7</span> active community
            </div>
          </div>

          {/* Rewards Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            <div className="text-[#1ca152] text-4xl mb-4">
              <FaTrophy />
            </div>
            <h3 className="text-xl font-bold mb-4 text-[#121416]">Earn Rewards</h3>
            <p className="text-gray-700">
              Top contributors receive monthly prizes and recognition. Points earned can be redeemed for:
            </p>
            <ul className="mt-4 text-sm text-gray-700 list-disc list-inside">
              <li>Amazon gift cards</li>
              <li>Wikipedia merchandise</li>
              <li>Special recognition on our leaderboard</li>
            </ul>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-16 bg-white p-8 rounded-2xl shadow-sm">
          <h3 className="text-2xl font-bold mb-6 text-[#121416]">How Your Contributions Make a Difference</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1: LLM flagging (find + agent) */}
            <div className="flex flex-col items-center text-center">
              <div className="flex justify-center gap-2 mb-4">
                <img src="/process/find.png" alt="LLM Find" className="w-32 h-32 inline-block" />
                <img src="/process/agent.png" alt="LLM Agent" className="w-32 h-32 inline-block" />
              </div>
              <p className="text-base text-[#121416] font-medium">Our system flags a possible inconsistency</p>
            </div>
            {/* Step 2: You check the flagged content */}
            <div className="flex flex-col items-center text-center">
              <img src="/process/review.png" alt="You Review" className="w-32 h-32 mb-4" />
              <p className="text-base text-[#121416] font-medium">You check the flagged content</p>
            </div>
            {/* Step 3: You submit the fix and get acknowledged */}
            <div className="flex flex-col items-center text-center">
              <img src="/process/submit.png" alt="Submit to Wikipedia" className="w-32 h-32 mb-4" />
              <p className="text-base text-[#121416] font-medium">We submit the fix to Wikipedia, acknowledging your contribution</p>
            </div>
            {/* Step 4: Rewards */}
            <div className="flex flex-col items-center text-center">
              <img src="/process/reward.png" alt="Earn Rewards" className="w-32 h-32 mb-4" />
              <p className="text-base text-[#121416] font-medium">You earn points and rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 