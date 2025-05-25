import React from 'react';

const TaskSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Combined Claim & Context Section */}
      <section className="bg-white rounded-xl p-4 mb-4">
        <div className="mb-2">
          <div className="h-8 w-3/4 bg-[#f1f2f4] rounded mb-2"></div>
          <div className="h-6 w-full bg-[#f1f2f4] rounded mb-2"></div>
          <div className="h-6 w-5/6 bg-[#f1f2f4] rounded"></div>
        </div>
        <div>
          <div className="h-6 w-full bg-[#f1f2f4] rounded mb-2"></div>
          <div className="h-6 w-4/5 bg-[#f1f2f4] rounded mb-2"></div>
          <div className="h-6 w-3/4 bg-[#f1f2f4] rounded"></div>
        </div>
      </section>

      {/* Analysis Section */}
      <section className="bg-white rounded-xl p-4 mb-4">
        <div className="h-6 w-24 bg-[#f1f2f4] rounded mb-3"></div>
        <div className="space-y-2">
          <div className="h-5 w-full bg-[#f1f2f4] rounded"></div>
          <div className="h-5 w-5/6 bg-[#f1f2f4] rounded"></div>
          <div className="h-5 w-4/6 bg-[#f1f2f4] rounded"></div>
          <div className="h-5 w-3/4 bg-[#f1f2f4] rounded"></div>
        </div>
      </section>

      {/* References Section */}
      <section className="bg-white rounded-xl border border-[#f1f2f4] p-4 mb-4">
        <div className="h-4 w-24 bg-[#f1f2f4] rounded mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-[#f1f2f4] rounded"></div>
          <div className="h-4 w-5/6 bg-[#f1f2f4] rounded"></div>
          <div className="h-4 w-4/6 bg-[#f1f2f4] rounded"></div>
        </div>
      </section>

      {/* Spacer to push CTA to bottom */}
      <div className="flex-1" />

      {/* CTA Section - Sticky at bottom */}
      <div className="sticky bottom-0 bg-white pt-4">
        <section className="bg-white rounded-xl p-4 flex flex-col gap-3">
          <div className="flex gap-4 mb-2">
            <div className="flex-1 h-12 bg-[#f1f2f4] rounded-lg"></div>
            <div className="flex-1 h-12 bg-[#f1f2f4] rounded-lg"></div>
          </div>
          <div className="h-5 w-32 bg-[#f1f2f4] rounded mb-1"></div>
          <div className="h-24 w-full bg-[#f1f2f4] rounded"></div>
          <div className="flex gap-3 justify-end">
            <div className="h-12 w-40 bg-[#f1f2f4] rounded-lg"></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TaskSkeleton; 