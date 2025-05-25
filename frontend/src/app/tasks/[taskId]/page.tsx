"use client";
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Split from 'react-split';
import TaskSkeleton from '@/components/TaskSkeleton';
import dynamic from 'next/dynamic';
import { useConfetti } from '@/contexts/ConfettiContext';
import { useProgress } from '@/contexts/ProgressContext';
import Image from 'next/image';

const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false
});

interface TaskDetail {
  id: string;
  text: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'open' | 'correct_1' | 'correct_2' | 'closed_correct' | 'wrong_1' | 'wrong_2' | 'closed_wrong' | 'disputed' | 'third_correct' | 'third_wrong';
  xp?: number;
  context?: string;
  analysis?: string;
  claim?: string;
  references?: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showConfetti } = useConfetti();
  const { completedTasks, updateCompletedTasks } = useProgress();
  const taskId = params.taskId as string;
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wikiUrl, setWikiUrl] = useState<string>(
    'https://en.wikipedia.org/wiki/Isabel_Garc%C3%A9s#References'
  );
  const [selectedOption, setSelectedOption] = useState<'agree' | 'disagree' | null>(null);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  });
  const [user, setUser] = useState<any>(null);

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
    const fetchTaskDetail = async () => {
      try {
        setLoading(true);
        const userData = JSON.parse(localStorage.getItem("wikifacts_user") || "null");
        if (!userData?.token) {
          setError('Please log in to access tasks');
          return;
        }

        const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${userData.token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch task details');
        }
        const data = await response.json();
        setTask(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching task details:', error);
        setError('Failed to load task details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetail();
    }
  }, [taskId]);

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
      const submitResponse = await fetch(`${API_URL}/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agrees_with_claim: selectedOption === 'agree',
          user_analysis: explanation
        })
      });

      if (!submitResponse.ok) {
        throw new Error('Failed to submit task');
      }

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
      const randomResponse = await fetch(`${API_URL}/api/tasks/rand`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      if (!randomResponse.ok) {
        if (randomResponse.status === 404) {
          setError('No more tasks available. Great job!');
          setSubmitting(false);
          return;
        }
        throw new Error('Failed to get random task');
      }

      const randomTask = await randomResponse.json();
      
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
      const randomResponse = await fetch(`${API_URL}/api/tasks/rand`, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      if (!randomResponse.ok) {
        if (randomResponse.status === 404) {
          setError('No more tasks available. Great job!');
          return;
        }
        throw new Error('Failed to get random task');
      }

      const randomTask = await randomResponse.json();
      
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
    <div className="relative flex h-screen flex-col bg-[#f5f5f5] overflow-hidden">
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

      <div className="max-w-7xl mx-auto w-full h-full py-5">
        <div className="w-full h-full">
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
            {/* Left Pane: Task Details (scrollable) */}
            <div className="flex flex-col h-full overflow-y-auto pr-4 bg-[#f5f5f5]">
              {/* Combined Claim & Context Section */}
              <section
                className="bg-[#f5f5f5] rounded-xl p-4 mb-4 cursor-pointer hover:bg-[#f1f2f4] transition-colors"
                onClick={() => setWikiUrl('https://en.wikipedia.org/wiki/Isabel_Garc%C3%A9s#References')}
                title="Show Wikipedia: Isabel Garcés in viewer"
              >
                <div className="mb-2">
                  <p className="text-2xl font-bold text-gray-900 mb-2">{task.claim || 'No claim provided'}</p>
                </div>
                <div>
                  <p className="text-lg text-gray-800">{task.context || 'No context provided'}</p>
                </div>
              </section>
              {/* Analysis Section */}
              <section
                className="bg-[#f5f5f5] rounded-xl p-4 mb-4 cursor-pointer hover:bg-[#f1f2f4] transition-colors"
                onClick={() => setWikiUrl('https://en.wikipedia.org/wiki/1937_Pittsburgh_Pirates_(NFL)_season#Week_2_(Sunday_September_19,_1937):_Brooklyn_Dodgers')}
                title="Show Wikipedia: 1937 Pittsburgh Pirates NFL Season, Week 2 in viewer"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-3">Analysis</h2>
                <p className="text-base text-gray-800">{task.analysis || 'No analysis provided'}</p>
              </section>
              {/* References Section */}
              {task.references && task.references.length > 0 && (
                <section className="bg-[#f5f5f5] rounded-xl border border-[#f1f2f4] p-4 mb-4">
                  <h2 className="text-[#121416] text-sm font-bold mb-3">References</h2>
                  <ul className="list-disc list-inside space-y-1">
                    {task.references.map((ref, index) => (
                      <li key={index} className="text-[#121416] text-xs">
                        <a href={ref} target="_blank" rel="noopener noreferrer" className="text-[#1a73e8] hover:underline">
                          {ref}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {/* Spacer to push CTA to bottom */}
              <div className="flex-1" />
              {/* CTA Section - Now sticky at bottom */}
              <div className="sticky bottom-0 bg-[#f5f5f5] pt-4">
                <section className="bg-[#f5f5f5] rounded-xl p-4 flex flex-col gap-3">
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
            {/* Right Pane: Wikipedia Article (not scrollable) */}
            <div className="h-full w-full bg-white rounded-lg border border-[#f1f2f4] overflow-hidden">
              <object
                data={wikiUrl}
                type="text/html"
                className="w-full h-full"
                style={{ minHeight: '100%', minWidth: '100%' }}
              >
                <div className="flex items-center justify-center h-full text-[#60758a] text-xs">
                  Unable to load Wikipedia article.
                  <a
                    href={wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1a73e8] hover:underline ml-1"
                  >
                    Open in new tab
                  </a>
                </div>
              </object>
            </div>
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
`;

// Add style tag to the document
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}