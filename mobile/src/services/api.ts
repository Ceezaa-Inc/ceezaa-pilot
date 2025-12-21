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

// Fused taste types
export interface FusedCategory {
  name: string;
  percentage: number;
  color: string;
  count: number;
  total_spend: number;
}

export interface FusedTasteProfile {
  user_id: string;
  profile_title: string;
  profile_tagline: string;
  categories: FusedCategory[];
  vibes: string[];
  exploration_ratio: number;
  confidence: number;
  quiz_weight: number;
  tx_weight: number;
}

// Ring visualization types
export interface RingSegment {
  category: string;
  percentage: number;
  color: string;
}

export interface TasteRingData {
  segments: RingSegment[];
  profile_title: string;
  tagline: string;
}

// Insight types
export interface ApiInsight {
  id: string;
  type: string;
  title: string;
  body: string;
  emoji: string;
  created_at: string;
}

export interface InsightsResponse {
  insights: ApiInsight[];
  generated_at: string | null;
}

// DNA types
export interface ApiDNATrait {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  created_at: string;
}

export interface DNAResponse {
  traits: ApiDNATrait[];
  generated_at: string | null;
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

  getFused: (userId: string): Promise<FusedTasteProfile> =>
    api.get(`/api/taste/fused/${userId}`),

  getRing: (userId: string): Promise<TasteRingData> =>
    api.get(`/api/taste/ring/${userId}`),

  getInsights: (userId: string): Promise<InsightsResponse> =>
    api.get(`/api/taste/insights/${userId}`),

  clearInsightsCache: (userId: string): Promise<{ deleted: number }> =>
    api.delete(`/api/taste/insights/${userId}/cache`),

  getDNA: (userId: string): Promise<DNAResponse> =>
    api.get(`/api/taste/dna/${userId}`),

  clearDNACache: (userId: string): Promise<{ deleted: number }> =>
    api.delete(`/api/taste/dna/${userId}/cache`),
};

// Discover types
export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
}

export interface MoodsResponse {
  moods: MoodOption[];
}

export interface DiscoverVenue {
  id: string;
  name: string;
  cuisine_type: string | null;
  tagline: string | null;
  price_tier: string | null;
  energy: string | null;
  taste_cluster: string | null;
  best_for: string[];
  standout: string[];
  match_score: number;
  match_reasons: string[];
  google_rating: number | null;
  formatted_address: string | null;
  photo_url: string | null;
  lat: number | null;
  lng: number | null;
}

export interface DiscoverFeedResponse {
  venues: DiscoverVenue[];
  total: number;
  has_more: boolean;
  mood: string | null;
}

export interface DiscoverFeedParams {
  mood?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

// Discover API
export const discoverApi = {
  getMoods: (): Promise<MoodsResponse> => api.get('/api/discover/moods'),

  getFeed: (userId: string, params?: DiscoverFeedParams): Promise<DiscoverFeedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.mood) queryParams.append('mood', params.mood);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/api/discover/feed/${userId}${queryString ? `?${queryString}` : ''}`;
    return api.get(url);
  },

  getVenue: (venueId: string, userId: string): Promise<DiscoverVenue> =>
    api.get(`/api/discover/venue/${venueId}?user_id=${userId}`),
};

// Vault types
export interface VaultVisit {
  id: string;
  venue_id: string | null;
  venue_name: string | null;
  venue_type: string | null;
  visited_at: string;
  amount: number | null;
  reaction: string | null;
  notes: string | null;
  source: string;
}

export interface VaultPlace {
  venue_id: string | null;
  venue_name: string;
  venue_type: string | null;
  visit_count: number;
  last_visit: string;
  total_spent: number;
  reaction: string | null;
  photo_url: string | null;
  visits: VaultVisit[];
}

export interface VaultStats {
  total_places: number;
  total_visits: number;
  this_month_spent: number;
}

export interface VaultResponse {
  places: VaultPlace[];
  stats: VaultStats;
}

export interface CreateVisitRequest {
  venue_id?: string;
  merchant_name: string;
  visited_at: string;
  amount?: number;
  reaction?: string;
  notes?: string;
}

export interface UpdateVisitRequest {
  reaction?: string;
  notes?: string;
  mood_tags?: string[];
}

// Vault API
export const vaultApi = {
  getVisits: (userId: string): Promise<VaultResponse> =>
    api.get(`/api/vault/visits/${userId}`),

  createVisit: (userId: string, data: CreateVisitRequest): Promise<VaultVisit> =>
    api.post(`/api/vault/visits/${userId}`, data),

  updateVisit: (visitId: string, data: UpdateVisitRequest): Promise<VaultVisit> =>
    request(`/api/vault/visits/${visitId}`, { method: 'PATCH' as any, body: data }),
};

// Session types
export interface SessionParticipant {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  is_host: boolean;
  has_voted: boolean;
}

export interface SessionVenue {
  venue_id: string;
  venue_name: string;
  venue_type: string | null;
  photo_url: string | null;
  votes: number;
  voted_by: string[];
}

export interface Session {
  id: string;
  code: string;
  title: string;
  planned_date: string | null;
  planned_time: string | null;
  status: string;
  host_id: string;
  participants: SessionParticipant[];
  venues: SessionVenue[];
  winner_id: string | null;
  created_at: string;
}

export interface SessionListItem {
  id: string;
  code: string;
  title: string;
  planned_date: string | null;
  status: string;
  participant_count: number;
  venue_count: number;
  created_at: string;
}

export interface SessionsListResponse {
  active: SessionListItem[];
  past: SessionListItem[];
}

export interface CreateSessionRequest {
  title: string;
  planned_date?: string;
  planned_time?: string;
}

// Sessions API
export const sessionsApi = {
  getSessions: (userId: string): Promise<SessionsListResponse> =>
    api.get(`/api/sessions/${userId}`),

  createSession: (userId: string, data: CreateSessionRequest): Promise<Session> =>
    api.post(`/api/sessions/${userId}`, data),

  getSession: (sessionId: string): Promise<Session> =>
    api.get(`/api/sessions/detail/${sessionId}`),

  joinSession: (code: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/join/${code}?user_id=${userId}`),

  addVenue: (sessionId: string, venueId: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/venues?user_id=${userId}`, { venue_id: venueId }),

  vote: (sessionId: string, venueId: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/vote?user_id=${userId}`, { venue_id: venueId }),

  closeVoting: (sessionId: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/close?user_id=${userId}`),
};

export { ApiError };
