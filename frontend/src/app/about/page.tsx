import React from 'react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#121416]">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-center tracking-tight">Welcome to the Future of Fact-Checking!</h1>
        <p className="text-base md:text-lg mb-6 text-[#121416] text-center max-w-2xl mx-auto">
          Join a vibrant community of knowledge enthusiasts, students, and experts working together to make Wikipedia more accurate, reliable, and inspiring for everyone. Powered by Stanford research and your unique perspective!
        </p>

        {/* AI-Human Collaboration Section */}
        <section className="mb-8 bg-[#f1f2f4] rounded-xl border border-[#f1f2f4] shadow-sm p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold mb-2">AI + Human Collaboration</h2>
          <p className="mb-1 text-sm md:text-base">
            Our AI scans millions of Wikipedia articles, flagging possible inconsistencies. But only <span className="font-semibold">your human insight</span> can truly verify and improve what the world reads.
          </p>
          <p className="mb-2 text-sm md:text-base">
            Together, we create a smarter, more trustworthy Wikipedia—one fact at a time.
          </p>
          <div className="flex justify-center my-4">
            <Image 
              src="/human_ai.png"
              alt="Human and AI Collaboration"
              width={320}
              height={320}
              className="max-w-xs w-full rounded-lg border border-[#f1f2f4] shadow"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-2 bg-[#f1f2f4] rounded-lg flex flex-col items-center border border-[#f1f2f4]">
              <h3 className="font-semibold mb-1 text-base">AI System</h3>
              <p className="text-xs">Analyzes text & sources at scale</p>
            </div>
            <div className="text-center p-2 flex flex-col items-center justify-center">
              <h3 className="font-semibold mb-1 text-base">works with</h3>
            </div>
            <div className="text-center p-2 bg-[#f1f2f4] rounded-lg flex flex-col items-center border border-[#f1f2f4]">
              <h3 className="font-semibold mb-1 text-base">Human Community</h3>
              <p className="text-xs">Provides judgment & final verification</p>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="mb-8">
          <h2 className="text-xl md:text-xl font-bold mb-3">Getting Started is Easy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-[#f1f2f4] rounded-lg bg-[#f1f2f4] shadow-sm flex flex-col items-center">
              <h3 className="text-base font-semibold mb-1">1. Create Account</h3>
              <p className="text-xs text-center">Sign up in seconds and join a global movement for better knowledge.</p>
            </div>
            <div className="p-4 border border-[#f1f2f4] rounded-lg bg-[#f1f2f4] shadow-sm flex flex-col items-center">
              <h3 className="text-base font-semibold mb-1">2. Browse Topics</h3>
              <p className="text-xs text-center">Pick topics you love or want to learn about&mdash;there&apos;s something for everyone!</p>
            </div>
            <div className="p-4 border border-[#f1f2f4] rounded-lg bg-[#f1f2f4] shadow-sm flex flex-col items-center">
              <h3 className="text-base font-semibold mb-1">3. Start Helping</h3>
              <p className="text-xs text-center">Review, verify, and suggest improvements. Every click makes a difference.</p>
            </div>
          </div>
        </section>

        {/* Review Process Section */}
        <h2 className="text-[#121416] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">How It Works</h2>
        <div className="grid grid-cols-[40px_1fr] gap-x-2 px-4">
          <div className="flex flex-col items-center gap-1 pt-3">
            <div className="text-[#121416]" data-icon="FileText" data-size="24px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"></path>
              </svg>
            </div>
            <div className="w-[1.5px] bg-[#dde1e3] h-2 grow"></div>
          </div>
          <div className="flex flex-1 flex-col py-3">
            <p className="text-[#121416] text-base font-medium leading-normal">Review Information</p>
            <p className="text-[#6a7681] text-base font-normal leading-normal">Carefully examine the provided information and assess the validity of the claims.</p>
          </div>
          <div className="flex flex-col items-center gap-1 pb-3">
            <div className="w-[1.5px] bg-[#dde1e3] h-2"></div>
            <div className="text-[#121416]" data-icon="CursorClick" data-size="24px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M169.64,134.33l44.77-19.46A16,16,0,0,0,213,85.07L52.92,32.8A16,16,0,0,0,32.8,52.92L85.07,213a15.83,15.83,0,0,0,14.41,11l.79,0a15.83,15.83,0,0,0,14.6-9.59h0l19.46-44.77L184,219.31a16,16,0,0,0,22.63,0l12.68-12.68a16,16,0,0,0,0-22.63Zm-69.48,73.76.06-.05Zm95.15-.09-49.66-49.67a16,16,0,0,0-26,4.94l-19.42,44.65L48,48l159.87,52.21-44.64,19.41a16,16,0,0,0-4.94,26L208,195.31ZM88,24V16a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0ZM8,96a8,8,0,0,1,8-8h8a8,8,0,0,1,0,16H16A8,8,0,0,1,8,96ZM120.85,28.42l8-16a8,8,0,0,1,14.31,7.16l-8,16a8,8,0,1,1-14.31-7.16Zm-81.69,96a8,8,0,0,1-3.58,10.74l-16,8a8,8,0,0,1-7.16-14.31l16-8A8,8,0,0,1,39.16,124.42Z"></path>
              </svg>
            </div>
          </div>
          <div className="flex flex-1 flex-col py-3">
            <p className="text-[#121416] text-base font-medium leading-normal">Submit Your Feedback</p>
            <p className="text-[#6a7681] text-base font-normal leading-normal">Share your expert feedback and contribute to the accuracy of Wikipedia content.</p>
          </div>
        </div>
        <h2 className="text-[#121416] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Points & Recognition</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
          <div className="flex flex-1 gap-3 rounded-lg border border-[#dde1e3] bg-white p-4 flex-col">
            <div className="text-[#121416]" data-icon="Trophy" data-size="24px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M232,64H208V56a16,16,0,0,0-16-16H64A16,16,0,0,0,48,56v8H24A16,16,0,0,0,8,80V96a40,40,0,0,0,40,40h3.65A80.13,80.13,0,0,0,120,191.61V216H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16H136V191.58c31.94-3.23,58.44-25.64,68.08-55.58H208a40,40,0,0,0,40-40V80A16,16,0,0,0,232,64ZM48,120A24,24,0,0,1,24,96V80H48v32q0,4,.39,8Zm144-8.9c0,35.52-28.49,64.64-63.51,64.9H128a64,64,0,0,1-64-64V56H192ZM232,96a24,24,0,0,1-24,24h-.5a81.81,81.81,0,0,0,.5-8.9V80h24Z"></path>
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-[#121416] text-base font-bold leading-tight">Earn Points</h2>
              <p className="text-[#6a7681] text-sm font-normal leading-normal">Accumulate points for each verified claim and climb the leaderboard.</p>
            </div>
          </div>
          <div className="flex flex-1 gap-3 rounded-lg border border-[#dde1e3] bg-white p-4 flex-col">
            <div className="text-[#121416]" data-icon="Star" data-size="24px" data-weight="regular">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                <path d="M239.2,97.29a16,16,0,0,0-13.81-11L166,81.17,142.72,25.81h0a15.95,15.95,0,0,0-29.44,0L90.07,81.17,30.61,86.32a16,16,0,0,0-9.11,28.06L66.61,153.8,53.09,212.34a16,16,0,0,0,23.84,17.34l51-31,51.11,31a16,16,0,0,0,23.84-17.34l-13.51-58.6,45.1-39.36A16,16,0,0,0,239.2,97.29Zm-15.22,5-45.1,39.36a16,16,0,0,0-5.08,15.71L187.35,216v0l-51.07-31a15.9,15.9,0,0,0-16.54,0l-51,31h0L82.2,157.4a16,16,0,0,0-5.08-15.71L32,102.35a.37.37,0,0,1,0-.09l59.44-5.14a16,16,0,0,0,13.35-9.75L128,32.08l23.2,55.29a16,16,0,0,0,13.35,9.75L224,102.26S224,102.32,224,102.33Z"></path>
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-[#121416] text-base font-bold leading-tight">Gain Recognition</h2>
              <p className="text-[#6a7681] text-sm font-normal leading-normal">Get recognized within the community for your valuable contributions and expertise.</p>
            </div>
          </div>
        </div>

        {/* Project Leadership Section */}
        <section className="mb-8">
          <h2 className="text-xl md:text-xl font-bold mb-3">Project Leadership</h2>
          <div className="p-4 border border-[#f1f2f4] rounded-lg bg-[#f1f2f4] shadow-sm">
            <h3 className="text-base font-semibold mb-2">Stanford OVAL Lab</h3>
            <p className="mb-2 text-[#121416] text-sm md:text-base">
              This project is led by the Open Virtual Assistant Lab (OVAL) at Stanford University, dedicated to improving the quality of information available online through collaborative research.
            </p>
            <p className="text-[#121416] text-sm md:text-base">
              Our research uncovered patterns where online information might not match its cited sources. This platform empowers you to help fix those gaps—one fact at a time.
            </p>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="text-center">
          <h2 className="text-2xl font-extrabold mb-4 drop-shadow-sm">Ready to Make a Difference?</h2>
          <p className="mb-6 text-[#121416] text-base">Start your journey as a Wikipedia fact-checker today. Every contribution helps thousands of people access more reliable information online.</p>
          <button className="bg-[#121416] text-white px-8 py-3 rounded-lg font-bold text-base hover:bg-[#23272f] transition-colors shadow-lg">
            Join the Movement
          </button>
        </section>
      </main>
    </div>
  );
} 