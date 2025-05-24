import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">How Our Project Works</h1>
        
        <p className="text-lg mb-8 text-gray-700">
          Join our community effort to improve online information through a simple three-step process designed by Stanford researchers.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">AI-Human Collaboration</h2>
          <p className="mb-4 text-gray-700">
            We&apos;ve used our state-of-the-art AI system to analyze millions of Wikipedia articles and identify potential inconsistencies between the text and cited sources.
          </p>
          <p className="mb-4 text-gray-700">
            Now we need your help to review these findings. Human judgment is essential to verify what our AI has flagged and help propose thoughtful improvements to Wikipedia&apos;s content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">AI System</h3>
              <p className="text-gray-700">Analyzes text & sources at scale to flag potential issues</p>
            </div>
            <div className="text-center p-4">
              <h3 className="font-semibold mb-2">works with</h3>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Human Community</h3>
              <p className="text-gray-700">Provides judgment, context & final verification</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-4">1. Create Account</h3>
              <p className="text-gray-700">Sign up for free in less than a minute to join our community</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-4">2. Browse Topics</h3>
              <p className="text-gray-700">Select topics that match your interests or expertise</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-4">3. Start Helping</h3>
              <p className="text-gray-700">Review information and help improve online knowledge</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">The Simple Review Process</h2>
          <div className="space-y-8">
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-4">1. Select a Topic</h3>
              <p className="text-gray-700">Browse through our collection of topics based on your interests or expertise. Choose something you&apos;re familiar with or excited to learn about.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-4">2. Review Information</h3>
              <p className="text-gray-700">Check if the information matches what the sources say. Our AI has already flagged potential issues, but your human judgment is crucial to confirm if there&apos;s really a problem.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <h3 className="text-xl font-semibold mb-4">3. Submit Your Feedback</h3>
              <p className="text-gray-700">Tell us if the information seems right or wrong based on the sources. Add your thoughts and any additional resources you think might help.</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Simple Point System</h2>
          <p className="mb-4 text-gray-700">Earn points with every contribution and watch your impact grow</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">+1</p>
              <p className="text-gray-700">For each review you submit</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">+2</p>
              <p className="text-gray-700">When you find an issue that needs improvement</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">+1</p>
              <p className="text-gray-700">For each friend who joins using your invite link</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">What Your Points Earn You</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Special badges on your profile</li>
            <li>Recognition on our leaderboard</li>
            <li>Access to exclusive community events</li>
            <li>Potential acknowledgment in research papers</li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Project Leadership</h2>
          <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Stanford OVAL Lab</h3>
            <p className="mb-4 text-gray-700">
              This project is led by the Open Virtual Assistant Lab (OVAL) at Stanford University, dedicated to improving the quality of information available online through collaborative research.
            </p>
            <p className="text-gray-700">
              Our research identified patterns where online information might not match its cited sources. This community platform is designed to address those issues through collaborative effort.
            </p>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-semibold mb-6">Ready to Join Our Community?</h2>
          <p className="mb-8 text-gray-700">Start making a difference today. Every contribution helps thousands of people access more reliable information online.</p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Join Now
          </button>
        </section>
      </main>
    </div>
  );
} 