import React from 'react';

const TaskSkeleton = () => {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Top Section: Claim and Evidence Sentences */}
      <div className="flex-1 min-h-0 mb-4">
        <div className="flex h-full min-h-0 gap-2">
          {/* Left Panel: Claim */}
          <div className="flex-1 flex flex-col">
            <div className="mb-3">
              {/* Claim sentence skeleton */}
              <div className="min-h-[3rem] flex items-center">
                <div className="h-6 w-full bg-[#f1f2f4] rounded"></div>
              </div>
            </div>
            <div className="flex-1">
              {/* Claim iframe skeleton */}
              <div className="h-full w-full bg-[#f1f2f4] rounded-lg border border-[#e5e7eb]">
                <div className="h-full w-full bg-gradient-to-br from-[#f1f2f4] to-[#e5e7eb] rounded-lg"></div>
              </div>
            </div>
          </div>
          
          {/* Right Panel: Evidence */}
          <div className="flex-1 flex flex-col">
            <div className="mb-3">
              {/* Evidence sentence skeleton */}
              <div className="min-h-[3rem] flex items-center">
                <div className="h-6 w-full bg-[#f1f2f4] rounded"></div>
              </div>
            </div>
            <div className="flex-1">
              {/* Evidence iframe skeleton */}
              <div className="h-full w-full bg-[#f1f2f4] rounded-lg border border-[#e5e7eb]">
                <div className="h-full w-full bg-gradient-to-br from-[#f1f2f4] to-[#e5e7eb] rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: LLM Analysis and CTAs */}
      <div className="flex gap-4">
        {/* LLM Analysis Skeleton */}
        <div className="flex-1 bg-[#f5f5f5] rounded-xl p-4">
          <div className="h-6 w-32 bg-[#f1f2f4] rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-[#f1f2f4] rounded"></div>
            <div className="h-4 w-5/6 bg-[#f1f2f4] rounded"></div>
            <div className="h-4 w-4/5 bg-[#f1f2f4] rounded"></div>
            <div className="h-4 w-3/4 bg-[#f1f2f4] rounded"></div>
          </div>
        </div>

        {/* CTA Section Skeleton */}
        <div className="w-80 bg-[#f5f5f5] rounded-xl p-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1 h-8 bg-[#f1f2f4] rounded-lg"></div>
              <div className="flex-1 h-8 bg-[#f1f2f4] rounded-lg"></div>
            </div>
            <div className="h-20 w-full bg-[#f1f2f4] rounded-lg"></div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-[#f1f2f4] rounded-lg"></div>
              <div className="flex-1 h-8 bg-[#f1f2f4] rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskSkeleton; 