/**
 * Base API client for backend communication
 */

import { API_BASE_URL } from '@/config';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] ${method} ${url}`);

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', body, headers }),

  put: <T>(endpoint: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', body, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
};

// Quiz submission types
export interface QuizAnswer {
  question_id: number;
  answer_id: string;
}

export interface SubmitQuizResponse {
  success: boolean;
  profile_title: string;
  profile_tagline: string;
}

// Taste profile types
export interface TasteTrait {
  name: string;
  emoji: string;
  description: string;
  score: number;
  color: string;
}

export interface TasteProfile {
  title: string;
  tagline: string;
  traits: TasteTrait[];
  exploration_style: string | null;
  vibe_preferences: string[];
  cuisine_preferences: string[];
  price_tier: string | null;
}

// Onboarding API
export const onboardingApi = {
  submitQuiz: (userId: string, answers: QuizAnswer[]): Promise<SubmitQuizResponse> =>
    api.post('/api/onboarding/quiz', { user_id: userId, answers }),
};

// Taste API
export const tasteApi = {
  getProfile: (userId: string): Promise<TasteProfile> =>
    api.get(`/api/taste/profile/${userId}`),
};

export { ApiError };
