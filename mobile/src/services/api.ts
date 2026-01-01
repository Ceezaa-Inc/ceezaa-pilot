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
  top_cuisines: string[];
  exploration_ratio: number;
  confidence: number;
  quiz_weight: number;
  tx_weight: number;
}

// Observed taste types (transaction-based)
export interface ObservedCategoryBreakdown {
  count: number;
  total_spend: number;
  merchants: string[];
}

export interface TopMerchant {
  merchant_id: string;
  merchant_name: string;
  count: number;
}

export interface ObservedTasteProfile {
  categories: Record<string, ObservedCategoryBreakdown>;
  time_buckets: Record<string, number>;
  day_types: Record<string, number>;
  top_merchants: TopMerchant[];
  total_transactions: number;
  first_transaction_at: string | null;
  last_transaction_at: string | null;
  confidence: number;
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

  getObserved: (userId: string): Promise<ObservedTasteProfile> =>
    api.get(`/api/taste/observed/${userId}`),

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
  google_review_count: number | null;
  formatted_address: string | null;
  photo_url: string | null;
  photo_urls: string[];  // All venue photos for carousel
  lat: number | null;
  lng: number | null;
  // Rich Places API data
  google_maps_uri: string | null;
  website_uri: string | null;
  editorial_summary: string | null;
  generative_summary: string | null;
  opening_hours: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
  } | null;
  // Atmosphere features
  dine_in: boolean | null;
  delivery: boolean | null;
  takeout: boolean | null;
  reservable: boolean | null;
  good_for_groups: boolean | null;
  outdoor_seating: boolean | null;
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
  city?: string;
  limit?: number;
  offset?: number;
}

// Seed request/response types
export interface SeedRequest {
  city: string;
  lat: number;
  lng: number;
}

export interface SeedResponse {
  seeded: number;
  skipped: number;
  city: string;
}

// Discover API
export const discoverApi = {
  getMoods: (): Promise<MoodsResponse> => api.get('/api/discover/moods'),

  getFeed: (userId: string, params?: DiscoverFeedParams): Promise<DiscoverFeedResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.mood) queryParams.append('mood', params.mood);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/api/discover/feed/${userId}${queryString ? `?${queryString}` : ''}`;
    return api.get(url);
  },

  getVenue: (venueId: string, userId: string): Promise<DiscoverVenue> =>
    api.get(`/api/discover/venue/${venueId}?user_id=${userId}`),

  seedVenues: (data: SeedRequest): Promise<SeedResponse> =>
    api.post('/api/discover/seed', data),

  /**
   * Get photo URL for a venue using the photo proxy.
   * This hides the Google API key from the client.
   *
   * @param googlePlaceId - Google Place ID
   * @param photoIndex - Index of photo (default 0)
   * @param width - Max width in pixels (default 400)
   */
  getPhotoUrl: (googlePlaceId: string, photoIndex = 0, width = 400): string =>
    `${API_BASE_URL}/api/discover/photo/${googlePlaceId}/${photoIndex}?width=${width}`,
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
  google_place_id: string | null;  // For photo proxy
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

// Get user's timezone for API calls
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

// Vault API
export const vaultApi = {
  getVisits: (userId: string, timezone?: string): Promise<VaultResponse> => {
    const tz = timezone || getUserTimezone();
    return api.get(`/api/vault/visits/${userId}?tz=${encodeURIComponent(tz)}`);
  },

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
  match_percentage: number | null;
}

export interface SessionPendingInvitation {
  id: string;
  name: string;
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
  pending_invitations?: SessionPendingInvitation[];
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
  total_votes: number;
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

export interface AddVenueRequest {
  venue_id?: string;     // Existing venue UUID
  venue_name?: string;   // For creating new venue from vault place
  venue_type?: string;   // Category/cuisine for new venue
}

// Invitation types
export interface Invitation {
  id: string;
  session_id: string;
  session_title: string;
  session_date: string | null;
  inviter_name: string;
  inviter_avatar: string | null;
  participant_count: number;
  venue_count: number;
  created_at: string;
}

export interface InvitationsListResponse {
  invitations: Invitation[];
}

export interface InviteRequest {
  user_ids?: string[];
  phone_numbers?: string[];
}

export interface InviteResult {
  sent: number;
  failed: number;
  deep_link?: string;
}

export interface InvitationActionRequest {
  action: 'accept' | 'decline';
}

export interface InvitationActionResponse {
  success: boolean;
}

// User search types
export interface UserSearchResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface UserSearchResponse {
  users: UserSearchResult[];
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

  addVenue: (sessionId: string, data: AddVenueRequest, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/venues?user_id=${userId}`, data),

  vote: (sessionId: string, venueId: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/vote?user_id=${userId}`, { venue_id: venueId }),

  closeVoting: (sessionId: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/close?user_id=${userId}`),

  reopenVoting: (sessionId: string, userId: string): Promise<Session> =>
    api.post(`/api/sessions/${sessionId}/reopen?user_id=${userId}`),

  removeParticipant: (sessionId: string, participantUserId: string, userId: string): Promise<Session> =>
    api.delete(`/api/sessions/${sessionId}/participants/${participantUserId}?user_id=${userId}`),

  // Invitation methods
  getInvitations: (userId: string): Promise<InvitationsListResponse> =>
    api.get(`/api/sessions/${userId}/invitations`),

  sendInvitations: (sessionId: string, data: InviteRequest, userId: string): Promise<InviteResult> =>
    api.post(`/api/sessions/${sessionId}/invite?user_id=${userId}`, data),

  respondToInvitation: (invitationId: string, action: 'accept' | 'decline', userId: string): Promise<Session | InvitationActionResponse> =>
    api.post(`/api/sessions/invitations/${invitationId}/respond?user_id=${userId}`, { action }),
};

// Users API
export const usersApi = {
  search: (query: string, type: 'username' | 'phone'): Promise<UserSearchResponse> =>
    api.get(`/api/users/search?q=${encodeURIComponent(query)}&type=${type}`),
};

// Profile types
export interface ProfileData {
  id: string;
  username: string | null;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  linked_accounts_count: number;
}

export interface NotificationPreferences {
  daily_insights: boolean;
  streak_milestones: boolean;
  session_invites: boolean;
  voting_reminders: boolean;
  plan_confirmations: boolean;
  marketing: boolean;
}

export interface DataExportResponse {
  exported_at: string;
  data: Record<string, unknown>;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
}

// Profile API
export const profileApi = {
  getProfile: (userId: string): Promise<ProfileData> =>
    api.get(`/api/profile/${userId}`),

  getNotifications: (userId: string): Promise<NotificationPreferences> =>
    api.get(`/api/profile/${userId}/notifications`),

  updateNotifications: (
    userId: string,
    data: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> =>
    api.put(`/api/profile/${userId}/notifications`, data),

  exportData: (userId: string): Promise<DataExportResponse> =>
    api.post(`/api/profile/${userId}/export`),

  deleteAccount: (userId: string): Promise<DeleteAccountResponse> =>
    api.delete(`/api/profile/${userId}`, { 'X-Confirm-Delete': 'true' }),
};

export { ApiError };
