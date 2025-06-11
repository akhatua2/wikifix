export interface TaskData {
  id: string;
  claim: {
    sentence: string;
    context?: string;
    document_title?: string;
    text_span?: string;
    highlighted_html?: string;
  };
  evidence: {
    sentence: string;
    context?: string;
    document_title?: string;
    text_span?: string;
    highlighted_html?: string;
  };
  llm_analysis?: string;
  contradiction_type?: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: string;
  xp?: number;
}

export interface TaskSubmission {
  agrees_with_claim: boolean;
  user_analysis: string;
}

// XP values for different difficulties
export const XP_VALUES = {
  Easy: 10,
  Medium: 25,
  Hard: 50
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function fetchTask(taskId: string, token: string): Promise<TaskData> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch task details');
  }
  return response.json();
}

export async function fetchRandomTask(token: string): Promise<TaskData> {
  const response = await fetch(`${API_URL}/api/tasks/rand`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch random task');
  }
  return response.json();
}

export async function fetchAllTasks(token: string): Promise<TaskData[]> {
  const response = await fetch(`${API_URL}/api/tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  return response.json();
}

export async function submitTask(
  taskId: string, 
  submission: TaskSubmission, 
  token: string
): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(submission)
  });
  if (!response.ok) {
    throw new Error('Failed to submit task');
  }
  return true;
} 