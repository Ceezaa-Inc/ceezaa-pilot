import { create } from 'zustand';
import {
  sessionsApi,
  Session as ApiSession,
  SessionListItem,
  SessionParticipant as ApiParticipant,
  SessionVenue as ApiSessionVenue,
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
  winnerId?: string;
  createdAt: string;
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
    createdAt: item.created_at,
  };
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  activeSessions: Session[];
  pastSessions: Session[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSessions: (userId: string) => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (sessionId: string | null) => void;
  joinSession: (code: string, userId: string) => Promise<Session | null>;
  createSession: (userId: string, data: CreateSessionData) => Promise<Session>;
  vote: (sessionId: string, venueId: string, userId: string) => Promise<void>;
  closeVoting: (sessionId: string, userId: string) => Promise<void>;
  addVenueToSession: (sessionId: string, venueId: string, userId: string) => Promise<boolean>;
  removeVenueFromSession: (sessionId: string, venueId: string) => boolean;
  getUserSessions: () => Session[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  currentSession: null,
  activeSessions: [],
  pastSessions: [],
  isLoading: false,
  error: null,

  fetchSessions: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionsApi.getSessions(userId);

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
        sessions: [...state.sessions.filter((s) => s.id !== session.id), session],
        activeSessions: [...state.activeSessions.filter((s) => s.id !== session.id), session],
      }));

      return session;
    } catch (error) {
      console.error('[Sessions] Failed to join session:', error);
      return null;
    }
  },

  createSession: async (userId, data) => {
    const response = await sessionsApi.createSession(userId, {
      title: data.name,
      planned_date: data.date,
      planned_time: data.time,
    });

    const session = mapApiSession(response);

    set((state) => ({
      sessions: [...state.sessions, session],
      currentSession: session,
      activeSessions: [...state.activeSessions, session],
    }));

    return session;
  },

  vote: async (sessionId, venueId, userId) => {
    // Optimistic update
    set((state) => ({
      sessions: state.sessions.map((session) => {
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
      }),
      currentSession:
        state.currentSession?.id === sessionId
          ? {
              ...state.currentSession,
              venues: state.currentSession.venues.map((venue) => {
                if (venue.venueId !== venueId) return venue;
                return {
                  ...venue,
                  votes: venue.votes + 1,
                  votedBy: [...venue.votedBy, userId],
                };
              }),
              participants: state.currentSession.participants.map((p) =>
                p.id === userId ? { ...p, hasVoted: true } : p
              ),
            }
          : state.currentSession,
    }));

    try {
      const response = await sessionsApi.vote(sessionId, venueId, userId);
      const session = mapApiSession(response);

      set((state) => ({
        currentSession: state.currentSession?.id === sessionId ? session : state.currentSession,
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
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

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
        currentSession: state.currentSession?.id === sessionId ? session : state.currentSession,
        activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
        pastSessions: [...state.pastSessions, session],
      }));
    } catch (error) {
      console.error('[Sessions] Failed to close voting:', error);
    }
  },

  addVenueToSession: async (sessionId, venueId, userId) => {
    try {
      const response = await sessionsApi.addVenue(sessionId, venueId, userId);
      const session = mapApiSession(response);

      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === sessionId ? session : s)),
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

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, venues: s.venues.filter((v) => v.venueId !== venueId) }
          : s
      ),
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

  getUserSessions: () => {
    return get().sessions;
  },
}));
