import React from 'react';
import { FaTrophy, FaWikipediaW, FaCheckCircle } from 'react-icons/fa';
import Image from 'next/image';

interface ImpactSectionProps {
  totalContributors: number;
  totalFixed: number;
}

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
              Your contributions directly improve the world&apos;s largest knowledge base.
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
                <Image src="/process/find.png" alt="LLM Find" width={128} height={128} className="w-32 h-32 inline-block" />
                <Image src="/process/agent.png" alt="LLM Agent" width={128} height={128} className="w-32 h-32 inline-block" />
              </div>
              <p className="text-base text-[#121416] font-medium">Our system flags a possible inconsistency</p>
            </div>
            {/* Step 2: You check the flagged content */}
            <div className="flex flex-col items-center text-center">
              <Image src="/process/review.png" alt="You Review" width={128} height={128} className="w-32 h-32 mb-4" />
              <p className="text-base text-[#121416] font-medium">You check the flagged content</p>
            </div>
            {/* Step 3: You submit the fix and get acknowledged */}
            <div className="flex flex-col items-center text-center">
              <Image src="/process/submit.png" alt="Submit to Wikipedia" width={128} height={128} className="w-32 h-32 mb-4" />
              <p className="text-base text-[#121416] font-medium">We submit the fix to Wikipedia, acknowledging your contribution</p>
            </div>
            {/* Step 4: Rewards */}
            <div className="flex flex-col items-center text-center">
              <Image src="/process/reward.png" alt="Earn Rewards" width={128} height={128} className="w-32 h-32 mb-4" />
              <p className="text-base text-[#121416] font-medium">You earn points and rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 