"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Split from 'react-split';
import TaskSkeleton from '@/components/TaskSkeleton';
import dynamic from 'next/dynamic';
import { useConfetti } from '@/contexts/ConfettiContext';
import { useProgress } from '@/contexts/ProgressContext';
import Image from 'next/image';
import { TaskData, TaskSubmission, fetchTask, submitTask, fetchRandomTask } from '@/types/task';
import WikipediaEmbed from '@/components/WikipediaEmbed';

const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showConfetti } = useConfetti();
  const { completedTasks, updateCompletedTasks } = useProgress();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wikiUrl, setWikiUrl] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<'agree' | 'disagree' | null>(null);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  });
  const [user, setUser] = useState<any>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // Prevent body scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Get user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
    if (userData) {
      setUser(userData);
    }
  }, []);

  // Update window size for confetti
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
        if (!userData?.token) {
          setError('Please log in to access tasks');
          return;
        }

        const data = await fetchTask(taskId, userData.token);
        setTask(data);
        // Set initial wiki URL to claim URL if available
        if (data.claim_url) {
          setWikiUrl(data.claim_url);
        }
        setError(null);
      } catch (error) {
        console.error('Error fetching task details:', error);
        setError('Failed to load task details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  // Intercept link clicks in LLM Analysis section
  useEffect(() => {
    const ref = analysisRef.current;
    if (!ref) return;
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        e.preventDefault();
        const href = (target as HTMLAnchorElement).getAttribute('href');
        if (href) setWikiUrl(href);
      }
    };
    ref.addEventListener('click', handleLinkClick);
    return () => {
      ref.removeEventListener('click', handleLinkClick);
    };
  }, [task]);

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('Please select whether you agree or disagree');
      return;
    }

    try {
      setSubmitting(true);
      const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
      if (!userData?.token) {
        setError('Please log in to submit tasks');
        return;
      }

      // Submit the current task
      await submitTask(taskId, {
        agrees_with_claim: selectedOption === 'agree',
        user_analysis: explanation
      }, userData.token);

      // Show confetti
      showConfetti();
      <ReactConfetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={500}
      />

      // Update completed tasks count
      const completedTasksResponse = await fetch(`${API_URL}/api/users/${userData.id}/completed-tasks`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      if (completedTasksResponse.ok) {
        const data = await completedTasksResponse.json();
        const newCount = data.total_completed || 0;
        updateCompletedTasks(newCount);
      }

      // Get a random task
      const randomTask = await fetchRandomTask(userData.token);
      
      if (!randomTask?.id) {
        console.error('Invalid random task response:', randomTask);
        setError('Failed to get next task. Please try again.');
        setSubmitting(false);
        return;
      }

      // Navigate after a short delay
      setTimeout(() => {
        router.replace(`/tasks/${randomTask.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error submitting task:', error);
      setError('Failed to submit task. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
      if (!userData?.token) {
        setError('Please log in to skip tasks');
        return;
      }

      // Get a random task
      const randomTask = await fetchRandomTask(userData.token);
      
      if (!randomTask?.id) {
        console.error('Invalid random task response:', randomTask);
        setError('Failed to get next task. Please try again.');
        return;
      }

      // Navigate to the new task
      router.replace(`/tasks/${randomTask.id}`);
    } catch (error) {
      console.error('Error skipping task:', error);
      setError('Failed to skip task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="relative flex h-screen flex-col bg-[#f5f5f5] overflow-hidden">
        <div className="max-w-7xl mx-auto w-full h-full py-5">
          <Split
            className="flex h-full gap-2"
            sizes={[40, 60]}
            minSize={300}
            direction="horizontal"
            gutterSize={2}
            gutterStyle={() => ({
              backgroundColor: '#f1f2f4',
              width: '2px',
              cursor: 'col-resize'
            })}
          >
            <div className="flex flex-col h-full overflow-y-auto pr-4 bg-[#f5f5f5]">
              <TaskSkeleton />
            </div>
            <div className="h-full w-full bg-[#f5f5f5] rounded-lg border border-[#f1f2f4] overflow-hidden">
              <div className="animate-pulse h-full w-full bg-gray-200"></div>
            </div>
          </Split>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex items-center justify-center h-screen overflow-hidden bg-[#f5f5f5]">
        <p className="text-[#a52828] text-lg">{error || 'Task not found'}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen min-h-0 bg-[#f5f5f5] overflow-hidden">
      {/* Progress Bar and Profile Section */}
      <div className="bg-[#f5f5f5] border-[#f1f2f4] py-3 px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 leading-tight tracking-[-0.015em]">WikiFix</h2>
          </Link>
          <div className="flex-1 mx-8 flex items-center gap-2">
            <div className="flex-1 h-2 bg-[#f1f2f4] rounded-full overflow-hidden">
              <div
                className="h-2 bg-[#1ca152] rounded-full transition-all"
                style={{ width: `${Math.min(completedTasks, 100)}%` }}
              ></div>
            </div>
            <span className="text-base font-semibold text-[#1ca152] whitespace-nowrap">{completedTasks} tasks completed</span>
          </div>
          {user && (
            <Link href="/profile" className="flex items-center gap-2">
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
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full h-full py-5 min-h-0">
        <div className="w-full h-full min-h-0">
          <Split
            className="flex h-full min-h-0 gap-2"
            sizes={[40, 60]}
            minSize={300}
            direction="horizontal"
            gutterSize={2}
            gutterStyle={() => ({
              backgroundColor: '#f1f2f4',
              width: '2px',
              cursor: 'col-resize'
            })}
          >
            {/* Left Pane: Task Details (scrollable) */}
            <div className="flex flex-col h-full min-h-0 pr-4 bg-[#f5f5f5]">
              {/* Scrollable content above CTA */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {/* Claim & Context Section */}
                <section
                  className="bg-[#f5f5f5] rounded-xl p-4 mb-4 cursor-pointer hover:bg-[#f1f2f4] transition-colors"
                  onClick={() => task.claim_url && setWikiUrl(task.claim_url)}
                  title={task.claim_url ? `Show Wikipedia article in viewer` : ''}
                >
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-gray-900 mb-2">{task.claim || 'No claim provided'}</p>
                    {task.claim_text_span && (
                      <p className="text-sm text-gray-600 italic">{task.claim_text_span}</p>
                    )}
                  </div>
                  <div>
                    {/* <p className="text-lg text-gray-800">{task.context || 'No context provided'}</p> */}
                  </div>
                </section>

                {/* Analysis Section */}
                {/* <section className="bg-[#f5f5f5] rounded-xl p-4 mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">LLM Analysis</h2>
                  <p className="text-base text-gray-800">{task.report || 'No analysis provided'}</p>
                </section> */}

                <section className="bg-[#f5f5f5] rounded-xl p-4 mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">LLM Analysis</h2>
                  <div
                    ref={analysisRef}
                    className="text-base text-gray-800 llm-analysis-html"
                    dangerouslySetInnerHTML={{ __html: task.report || 'No analysis provided' }}
                  />
                </section>

                {/* Report URLs Section */}
                {/* {task.report_urls && (
                  <section className="bg-[#f5f5f5] rounded-xl border border-[#f1f2f4] p-4 mb-4">
                    <h2 className="text-[#121416] text-sm font-bold mb-3">Reference Articles</h2>
                    <ul className="list-disc list-inside space-y-1">
                      {JSON.parse(task.report_urls).map((url: string, index: number) => (
                        <li 
                          key={index} 
                          className="text-[#121416] text-xs cursor-pointer hover:bg-[#f1f2f4] p-1 rounded"
                          onClick={() => setWikiUrl(url)}
                        >
                          <span className="text-[#1a73e8] hover:underline">
                            {url.split('/').pop()?.replace(/_/g, ' ') || url}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )} */}
              </div>
              {/* CTA Section - always visible at bottom */}
              <div className="bg-[#f5f5f5]">
                <section className="bg-[#f5f5f5] rounded-xl p-4 flex flex-col gap-3 pb-0">
                  <div className="flex gap-4 mb-2">
                    <button 
                      className={`flex-1 px-4 py-2 rounded-lg text-lg font-bold transition-colors ${
                        selectedOption === 'agree' 
                          ? 'bg-[#1ca152] text-white hover:bg-[#178a41]'
                          : 'bg-[#a8e6cf] text-gray-900 hover:bg-[#8ed3b6] text-gray-900'
                      }`}
                      onClick={() => setSelectedOption(selectedOption === 'agree' ? null : 'agree')}
                    >
                      Agree
                    </button>
                    <button 
                      className={`flex-1 px-4 py-2 rounded-lg text-lg font-bold transition-colors ${
                        selectedOption === 'disagree' 
                          ? 'bg-[#a52828] text-white hover:bg-[#7d1d1d]'
                          : 'bg-[#ffb3b3] text-gray-900 hover:bg-[#ff9b9b] text-gray-900'
                      }`}
                      onClick={() => setSelectedOption(selectedOption === 'disagree' ? null : 'disagree')}
                    >
                      Disagree
                    </button>
                  </div>
                  <textarea 
                    id="explanation" 
                    rows={3} 
                    className="w-full rounded-lg border border-[#f1f2f4] p-2 text-base text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#dce8f3]" 
                    placeholder="Provide your reasoning or feedback..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                  />
                  <div className="flex gap-3 justify-end">
                    <button 
                      className="px-4 py-2 rounded-lg text-lg font-bold transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                      onClick={handleSkip}
                    >
                      Skip Task
                    </button>
                    <button 
                      className={`px-4 py-2 rounded-lg text-lg font-bold transition-colors ${
                        submitting 
                          ? 'bg-[#dce8f3] text-[#60758a] cursor-not-allowed'
                          : !selectedOption
                            ? 'bg-[#dce8f3] text-gray-900 cursor-not-allowed'
                            : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                      }`}
                      onClick={handleSubmit}
                      disabled={submitting || !selectedOption}
                    >
                      {submitting ? 'Submitting...' : 'Submit Analysis'}
                    </button>
                  </div>
                </section>
              </div>
            </div>
            {/* Right Pane: Wikipedia Article */}
            <WikipediaEmbed wikiUrl={wikiUrl} highlightText={task.claim_text_span} />
          </Split>
        </div>
      </div>
    </div>
  );
}

// Add styles at the end of the file
const styles = `
  .custom-gutter {
    background-color: #e5e7eb !important;
    width: 8px !important;
    cursor: col-resize !important;
  }
  .custom-gutter:hover {
    background-color: #9ca3af !important;
  }
  .llm-analysis-html a {
    color: #e67e22 !important; /* Example: orange color */
    text-decoration: underline;
    font-weight: 500;
    transition: color 0.2s;
  }
  .llm-analysis-html a:hover {
    color: #d35400 !important; /* Darker orange on hover */
  }
`;


// Add style tag to the document
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}