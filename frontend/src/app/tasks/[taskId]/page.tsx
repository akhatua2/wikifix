"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Split from 'react-split';
import TaskSkeleton from '@/components/TaskSkeleton';
import dynamic from 'next/dynamic';
import { useConfetti } from '@/contexts/ConfettiContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import Image from 'next/image';
import { TaskData, fetchTask, submitTask, fetchRandomTask } from '@/types/task';


interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  token: string;
}

const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showConfetti } = useConfetti();
  const { completedTasks, updateCompletedTasks } = useProgress();
  const { trackClick, trackInputDebounced, trackSelect, trackTask, trackSubmit, trackSkip, trackPage } = useAnalytics();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'agree' | 'disagree' | null>(null);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  });
  const [user, setUser] = useState<User | null>(null);

  const analysisRef = useRef<HTMLDivElement>(null);

  // Track page view when component mounts
  useEffect(() => {
    trackPage(`/tasks/${taskId}`, { task_id: taskId });
  }, [taskId, trackPage]);

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
        setError(null);
        
        // Track successful task load
        trackTask(taskId, {
          user_id: userData.id,
          claim_sentence: data.claim?.sentence,
          evidence_sentence: data.evidence?.sentence,
          contradiction_type: data.contradiction_type
        });
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
  }, [taskId, trackTask]);

  const handleSubmit = async () => {
    if (!selectedOption) {
      setError('Please select whether you agree or disagree');
      trackClick('submit_attempt_without_selection', { task_id: taskId });
      return;
    }

    if (!explanation.trim()) {
      setError('Please provide your reasoning or feedback');
      trackClick('submit_attempt_without_explanation', { task_id: taskId });
      return;
    }

    try {
      setSubmitting(true);
      const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
      if (!userData?.token) {
        setError('Please log in to submit tasks');
        return;
      }

      // Track submission attempt
      trackSubmit(taskId, selectedOption === 'agree', explanation.length, {
        user_id: userData.id,
        explanation_word_count: explanation.split(' ').length,
        time_spent_on_task: Date.now() - (performance.now() - performance.timeOrigin)
      });

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
      // Track skip action
      trackSkip(taskId, {
        user_id: user?.id,
        had_selection: selectedOption !== null,
        had_explanation: explanation.trim().length > 0,
        explanation_length: explanation.length
      });

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

  // Handle option selection with analytics
  const handleOptionSelect = (option: 'agree' | 'disagree') => {
    const newSelection = selectedOption === option ? null : option;
    setSelectedOption(newSelection);
    
    trackSelect('task_opinion', newSelection || 'deselected', {
      task_id: taskId,
      user_id: user?.id,
      previous_selection: selectedOption
    });
  };

  // Handle explanation input with analytics
  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setExplanation(value);
    
    // Track input with debouncing
    trackInputDebounced('explanation', value, {
      task_id: taskId,
      user_id: user?.id,
      word_count: value.split(' ').filter(word => word.length > 0).length
    });
  };

  if (loading) {
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

        <div className="max-w-7xl mx-auto w-full h-full py-5 min-h-0 flex flex-col">
          <TaskSkeleton />
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

      <div className="max-w-7xl mx-auto w-full h-full py-5 min-h-0 flex flex-col">
        {/* Wikipedia Embeds Side by Side */}
        <div className="flex-1 min-h-0 mb-4">
          <Split
            className="flex h-full min-h-0 gap-2"
            sizes={[50, 50]}
            minSize={300}
            direction="horizontal"
            gutterSize={2}
            gutterStyle={() => ({
              backgroundColor: '#f1f2f4',
              width: '2px',
              cursor: 'col-resize'
            })}
          >
            {/* Left Panel: Claim Content */}
            <div className="h-full flex flex-col">
              <div className="mb-3">
                <p className="text-base text-black font-semibold leading-6 min-h-[3rem] flex items-center">
                  {task.claim?.sentence || 'No claim provided'}
                </p>
              </div>
              <div className="flex-1 relative">
                <div className="h-full w-full bg-white rounded-lg border border-[#f1f2f4] overflow-hidden">
                  <iframe
                    srcDoc={task.claim?.highlighted_html || '<div style="padding: 2rem; text-align: center; color: #666;">No claim content available</div>'}
                    className="w-full h-full border-0"
                    title="Claim Content"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            
            {/* Right Panel: Evidence Content */}
            <div className="h-full flex flex-col">
              <div className="mb-3">
                <p className="text-base text-black font-semibold leading-6 min-h-[3rem] flex items-center">
                  {task.evidence?.sentence || 'No evidence provided'}
                </p>
              </div>
              <div className="flex-1 relative">
                <div className="h-full w-full bg-white rounded-lg border border-[#f1f2f4] overflow-hidden">
                  <iframe
                    srcDoc={task.evidence?.highlighted_html || '<div style="padding: 2rem; text-align: center; color: #666;">No evidence content available</div>'}
                    className="w-full h-full border-0"
                    title="Evidence Content"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </Split>
        </div>

        {/* Bottom Section: LLM Analysis and CTAs */}
        <div className="flex gap-4">
          {/* LLM Analysis */}
          <div className="flex-1 bg-[#f5f5f5] rounded-xl p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">LLM Analysis</h2>
            <div
              ref={analysisRef}
              className="text-base text-gray-800 llm-analysis-html max-h-32 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: task.llm_analysis || 'No analysis provided' }}
            />
            {task.contradiction_type && (
              <div className="mt-3 p-2 bg-red-50 rounded-lg">
                <p className="text-sm font-semibold text-red-800">Contradiction Type: {task.contradiction_type}</p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          <div className="w-80 bg-[#f5f5f5] rounded-xl p-4">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    selectedOption === 'agree' 
                      ? 'bg-[#1ca152] text-white hover:bg-[#178a41]'
                      : 'bg-[#a8e6cf] text-gray-900 hover:bg-[#8ed3b6]'
                  }`}
                  onClick={() => {
                    trackClick('agree_button', { task_id: taskId, user_id: user?.id });
                    handleOptionSelect('agree');
                  }}
                >
                  Agree
                </button>
                <button 
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    selectedOption === 'disagree' 
                      ? 'bg-[#a52828] text-white hover:bg-[#7d1d1d]'
                      : 'bg-[#ffb3b3] text-gray-900 hover:bg-[#ff9b9b]'
                  }`}
                  onClick={() => {
                    trackClick('disagree_button', { task_id: taskId, user_id: user?.id });
                    handleOptionSelect('disagree');
                  }}
                >
                  Disagree
                </button>
              </div>
              <textarea 
                id="explanation" 
                rows={3} 
                className="w-full rounded-lg border border-[#f1f2f4] p-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#dce8f3]" 
                placeholder="Provide your reasoning..."
                value={explanation}
                onChange={handleExplanationChange}
              />
              <div className="flex gap-2">
                <button 
                  className="px-3 py-2 rounded-lg text-sm font-bold transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200"
                  onClick={() => {
                    trackClick('skip_button', { task_id: taskId, user_id: user?.id });
                    handleSkip();
                  }}
                >
                  Skip
                </button>
                <button 
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    submitting 
                      ? 'bg-[#dce8f3] text-[#60758a] cursor-not-allowed'
                      : !selectedOption || !explanation.trim()
                        ? 'bg-[#dce8f3] text-gray-900 cursor-not-allowed'
                        : 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                  }`}
                  onClick={() => {
                    trackClick('submit_button', { 
                      task_id: taskId, 
                      user_id: user?.id,
                      has_selection: selectedOption !== null,
                      has_explanation: explanation.trim().length > 0
                    });
                    handleSubmit();
                  }}
                  disabled={submitting || !selectedOption || !explanation.trim()}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
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