import { create } from 'zustand';
import {
  sessionsApi,
  usersApi,
  Session as ApiSession,
  SessionListItem,
  SessionParticipant as ApiParticipant,
  SessionVenue as ApiSessionVenue,
  AddVenueRequest,
  Invitation,
  InviteRequest,
  InviteResult,
  UserSearchResult,
} from '@/services/api';

// Local types matching what components expect
export type SessionStatus = 'voting' | 'confirmed' | 'completed' | 'cancelled';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  hasVoted: boolean;
}

export interface SessionVenue {
  venueId: string;
  venueName: string;
  venueType: string | null;
  photoUrl?: string;
  matchPercentage?: number;
  votes: number;
  votedBy: string[];
}

export interface PendingInvitation {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  code: string;
  name: string;
  date: string | null;
  time: string | null;
  status: SessionStatus;
  hostId: string;
  participants: Participant[];
  venues: SessionVenue[];
  pendingInvitations: PendingInvitation[];
  winnerId?: string;
  createdAt: string;
  // Counts for list view (when full data not loaded)
  participantCount?: number;
  venueCount?: number;
  totalVotes?: number;
}

interface CreateSessionData {
  name: string;
  date?: string;
  time?: string;
}

// Helper to map API session to local format
function mapApiSession(api: ApiSession): Session {
  return {
    id: api.id,
    code: api.code,
    name: api.title,
    date: api.planned_date,
    time: api.planned_time,
    status: api.status as SessionStatus,
    hostId: api.host_id,
    participants: api.participants.map(mapApiParticipant),
    venues: api.venues.map(mapApiVenue),
    pendingInvitations: (api.pending_invitations || []).map((inv) => ({
      id: inv.id,
      name: inv.name,
    })),
    winnerId: api.winner_id || undefined,
    createdAt: api.created_at,
  };
}

function mapApiParticipant(api: ApiParticipant): Participant {
  return {
    id: api.user_id,
    name: api.name,
    avatar: api.avatar || undefined,
    isHost: api.is_host,
    hasVoted: api.has_voted,
  };
}

function mapApiVenue(api: ApiSessionVenue): SessionVenue {
  return {
    venueId: api.venue_id,
    venueName: api.venue_name,
    venueType: api.venue_type,
    photoUrl: api.photo_url || undefined,
    matchPercentage: api.match_percentage ?? undefined,
    votes: api.votes,
    votedBy: api.voted_by,
  };
}

function mapListItem(item: SessionListItem): Session {
  return {
    id: item.id,
    code: item.code,
    name: item.title,
    date: item.planned_date,
    time: null,
    status: item.status as SessionStatus,
    hostId: '',
    participants: [],
    venues: [],
    pendingInvitations: [],
    createdAt: item.created_at,
    participantCount: item.participant_count,
    venueCount: item.venue_count,
    totalVotes: item.total_votes,
  };
}

// Deduplication helpers - prevent duplicate sessions in lists
const dedupeAndAdd = (list: Session[], session: Session): Session[] =>
  [...list.filter((s) => s.id !== session.id), session];

const dedupeAndRemove = (list: Session[], sessionId: string): Session[] =>
  list.filter((s) => s.id !== sessionId);

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  activeSessions: Session[];
  pastSessions: Session[];
  pendingInvitations: Invitation[];
  isLoading: boolean;
  isLoadingInvitations: boolean;
  error: string | null;

  // Session Actions
  fetchSessions: (userId: string) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (sessionId: string | null) => void;
  joinSession: (code: string, userId: string) => Promise<Session | null>;
  createSession: (userId: string, data: CreateSessionData) => Promise<Session>;
  vote: (sessionId: string, venueId: string, userId: string) => Promise<void>;
  closeVoting: (sessionId: string, userId: string) => Promise<Session | null>;
  addVenueToSession: (sessionId: string, venue: AddVenueRequest, userId: string) => Promise<boolean>;
  removeVenueFromSession: (sessionId: string, venueId: string) => boolean;
  removeParticipant: (sessionId: string, participantUserId: string, userId: string) => Promise<boolean>;
  getUserSessions: () => Session[];

  // Invitation Actions
  fetchInvitations: (userId: string) => Promise<void>;
  acceptInvitation: (invitationId: string, userId: string) => Promise<Session | null>;
  declineInvitation: (invitationId: string, userId: string) => Promise<boolean>;
  sendInvitations: (sessionId: string, data: InviteRequest, userId: string) => Promise<InviteResult | null>;
  searchUsers: (query: string, type: 'username' | 'phone') => Promise<UserSearchResult[]>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  activeSessions: [],
  pastSessions: [],
  pendingInvitations: [],
  isLoading: false,
  isLoadingInvitations: false,
  error: null,

  fetchSessions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionsApi.getSessions(userId);

      // Trust backend categorization - use lists directly
      const activeSessions = response.active.map(mapListItem);
      const pastSessions = response.past.map(mapListItem);
      const allSessions = [...activeSessions, ...pastSessions];

      set({
        sessions: allSessions,
        activeSessions,
        pastSessions,
        isLoading: false,
      });
    } catch (error) {
      console.error('[Sessions] Failed to fetch sessions:', error);
      set({ isLoading: false, error: 'Failed to load sessions' });
    }
  },

  fetchSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionsApi.getSession(sessionId);
      const session = mapApiSession(response);

      set((state) => ({
        currentSession: session,
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
        isLoading: false,
      }));
    } catch (error) {
      console.error('[Sessions] Failed to fetch session:', error);
      set({ isLoading: false, error: 'Failed to load session' });
    }
  },

  setCurrentSession: (sessionId) => {
    if (!sessionId) {
      set({ currentSession: null });
      return;
    }
    const session = get().sessions.find((s) => s.id === sessionId);
    set({ currentSession: session || null });

    // Fetch full details if we only have list data
    if (session && session.participants.length === 0) {
      get().fetchSession(sessionId);
    }
  },

  joinSession: async (code, userId) => {
    try {
      const response = await sessionsApi.joinSession(code, userId);
      const session = mapApiSession(response);

      set((state) => ({
        currentSession: session,
        sessions: dedupeAndAdd(state.sessions, session),
        activeSessions: dedupeAndAdd(state.activeSessions, session),
        pastSessions: dedupeAndRemove(state.pastSessions, session.id),
      }));

      return session;
    } catch (error) {
      console.error('[Sessions] Failed to join session:', error);
      return null;
    }
  },

  createSession: async (userId, data) => {
    console.log('[Sessions] createSession called with:', { userId, data });

    if (!data || !data.name) {
      throw new Error('Session data is required with a name');
    }

    const response = await sessionsApi.createSession(userId, {
      title: data.name,
      planned_date: data.date,
      planned_time: data.time,
    });

    const session = mapApiSession(response);

    set((state) => ({
      sessions: dedupeAndAdd(state.sessions, session),
      currentSession: session,
      activeSessions: dedupeAndAdd(state.activeSessions, session),
    }));

    return session;
  },

  vote: async (sessionId, venueId, userId) => {
    const updateSessionVote = (session: Session): Session => {
      if (session.id !== sessionId) return session;
      return {
        ...session,
        venues: session.venues.map((venue) => {
          if (venue.venueId !== venueId) return venue;
          return {
            ...venue,
            votes: venue.votes + 1,
            votedBy: [...venue.votedBy, userId],
          };
        }),
        participants: session.participants.map((p) =>
          p.id === userId ? { ...p, hasVoted: true } : p
        ),
      };
    };

    // Optimistic update - update all lists
    set((state) => ({
      sessions: state.sessions.map(updateSessionVote),
      activeSessions: state.activeSessions.map(updateSessionVote),
      currentSession:
        state.currentSession?.id === sessionId
          ? updateSessionVote(state.currentSession)
          : state.currentSession,
    }));

    try {
      const response = await sessionsApi.vote(sessionId, venueId, userId);
      const session = mapApiSession(response);

      set((state) => ({
        currentSession: state.currentSession?.id === sessionId ? session : state.currentSession,
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
        activeSessions: state.activeSessions.map((s) => (s.id === sessionId ? session : s)),
      }));
    } catch (error) {
      console.error('[Sessions] Failed to vote:', error);
      // Could revert optimistic update here
    }
  },

  closeVoting: async (sessionId, userId) => {
    try {
      const response = await sessionsApi.closeVoting(sessionId, userId);
      const session = mapApiSession(response);

      // Just update the session in place - categorization is based on date, not voting status
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
        activeSessions: state.activeSessions.map((s) => (s.id === sessionId ? session : s)),
        pastSessions: state.pastSessions.map((s) => (s.id === sessionId ? session : s)),
        currentSession: state.currentSession?.id === sessionId ? session : state.currentSession,
      }));

      return session;
    } catch (error) {
      console.error('[Sessions] Failed to close voting:', error);
      return null;
    }
  },

  addVenueToSession: async (sessionId, venue, userId) => {
    try {
      const response = await sessionsApi.addVenue(sessionId, venue, userId);
      const session = mapApiSession(response);

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
        activeSessions: state.activeSessions.map((s) => (s.id === sessionId ? session : s)),
        currentSession: state.currentSession?.id === sessionId ? session : state.currentSession,
      }));

      return true;
    } catch (error) {
      console.error('[Sessions] Failed to add venue:', error);
      return false;
    }
  },

  removeVenueFromSession: (sessionId, venueId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session || session.venues.length <= 1) {
      return false;
    }

    const updateVenues = (s: Session) =>
      s.id === sessionId
        ? { ...s, venues: s.venues.filter((v) => v.venueId !== venueId) }
        : s;

    set((state) => ({
      sessions: state.sessions.map(updateVenues),
      activeSessions: state.activeSessions.map(updateVenues),
      currentSession:
        state.currentSession?.id === sessionId
          ? {
              ...state.currentSession,
              venues: state.currentSession.venues.filter((v) => v.venueId !== venueId),
            }
          : state.currentSession,
    }));

    return true;
  },

  removeParticipant: async (sessionId, participantUserId, userId) => {
    try {
      const response = await sessionsApi.removeParticipant(sessionId, participantUserId, userId);
      const session = mapApiSession(response);

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
        activeSessions: state.activeSessions.map((s) => (s.id === sessionId ? session : s)),
        currentSession: state.currentSession?.id === sessionId ? session : state.currentSession,
      }));

      return true;
    } catch (error) {
      console.error('[Sessions] Failed to remove participant:', error);
      return false;
    }
  },

  getUserSessions: () => {
    return get().sessions;
  },

  // Invitation Actions
  fetchInvitations: async (userId: string) => {
    set({ isLoadingInvitations: true });
    try {
      const response = await sessionsApi.getInvitations(userId);
      set({
        pendingInvitations: response.invitations,
        isLoadingInvitations: false,
      });
    } catch (error) {
      console.error('[Sessions] Failed to fetch invitations:', error);
      set({ isLoadingInvitations: false });
    }
  },

  acceptInvitation: async (invitationId: string, userId: string) => {
    // Optimistic update - remove from pending
    const invitation = get().pendingInvitations.find((i) => i.id === invitationId);
    set((state) => ({
      pendingInvitations: state.pendingInvitations.filter((i) => i.id !== invitationId),
    }));

    try {
      const response = await sessionsApi.respondToInvitation(invitationId, 'accept', userId);

      // Response is SessionResponse when accepting
      if ('id' in response && 'code' in response) {
        const session = mapApiSession(response as ApiSession);

        set((state) => ({
          sessions: dedupeAndAdd(state.sessions, session),
          activeSessions: dedupeAndAdd(state.activeSessions, session),
          pastSessions: dedupeAndRemove(state.pastSessions, session.id),
          currentSession: session,
        }));

        return session;
      }

      return null;
    } catch (error) {
      console.error('[Sessions] Failed to accept invitation:', error);
      // Revert optimistic update
      if (invitation) {
        set((state) => ({
          pendingInvitations: [...state.pendingInvitations, invitation],
        }));
      }
      return null;
    }
  },

  declineInvitation: async (invitationId: string, userId: string) => {
    // Optimistic update - remove from pending
    const invitation = get().pendingInvitations.find((i) => i.id === invitationId);
    set((state) => ({
      pendingInvitations: state.pendingInvitations.filter((i) => i.id !== invitationId),
    }));

    try {
      await sessionsApi.respondToInvitation(invitationId, 'decline', userId);
      return true;
    } catch (error) {
      console.error('[Sessions] Failed to decline invitation:', error);
      // Revert optimistic update
      if (invitation) {
        set((state) => ({
          pendingInvitations: [...state.pendingInvitations, invitation],
        }));
      }
      return false;
    }
  },

  sendInvitations: async (sessionId: string, data: InviteRequest, userId: string) => {
    try {
      const result = await sessionsApi.sendInvitations(sessionId, data, userId);
      return result;
    } catch (error) {
      console.error('[Sessions] Failed to send invitations:', error);
      return null;
    }
  },

  searchUsers: async (query: string, type: 'username' | 'phone') => {
    try {
      console.log('[Sessions] searchUsers called with:', { query, type });
      const response = await usersApi.search(query, type);
      console.log('[Sessions] searchUsers raw response:', JSON.stringify(response));
      // Handle both { users: [...] } and direct array response defensively
      const users = Array.isArray(response) ? response : response?.users || [];
      console.log('[Sessions] searchUsers parsed users count:', users.length);
      return users;
    } catch (error) {
      console.error('[Sessions] Failed to search users:', error);
      return [];
    }
  },
}));
