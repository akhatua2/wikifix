import React from 'react';

const TaskSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col gap-4">
        {/* Claim & Context Section Skeleton */}
        <div className="bg-white rounded-xl border border-[#f1f2f4] p-4">
          <div className="mb-2">
            <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Analysis Section Skeleton */}
        <div className="bg-white rounded-xl border border-[#f1f2f4] p-4">
          <div className="h-4 w-20 bg-gray-200 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* CTA Section Skeleton */}
        <div className="bg-white rounded-xl border border-[#f1f2f4] p-4">
          <div className="flex gap-4 mb-2">
            <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 h-8 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-20 w-full bg-gray-200 rounded"></div>
        </div>

        {/* References Section Skeleton */}
        <div className="bg-white rounded-xl border border-[#f1f2f4] p-4">
          <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Action Button Skeleton */}
        <div className="flex justify-end">
          <div className="h-8 w-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default TaskSkeleton; 