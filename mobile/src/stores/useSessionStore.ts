import { create } from 'zustand';
import {
  Session,
  SessionVenue,
  Participant,
  SESSIONS,
  getSessionById,
  getSessionByCode,
  getActiveSessions,
  generateSessionCode,
} from '@/mocks/sessions';
import { MoodType } from '@/mocks/taste';

interface CreateSessionData {
  name: string;
  date: string;
  time: string;
  mood?: MoodType;
  constraints?: string[];
  venues?: SessionVenue[];
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  activeSessions: Session[];
  isLoading: boolean;

  // Actions
  setCurrentSession: (sessionId: string | null) => void;
  joinSession: (code: string) => Session | null;
  createSession: (data: CreateSessionData) => Session;
  vote: (sessionId: string, venueId: string) => void;
  closeVoting: (sessionId: string) => void;
  refreshActiveSessions: () => void;
  addVenueToSession: (sessionId: string, venue: SessionVenue) => boolean;
  removeVenueFromSession: (sessionId: string, venueId: string) => boolean;
  getUserSessions: () => Session[];
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: SESSIONS,
  currentSession: null,
  activeSessions: getActiveSessions(),
  isLoading: false,

  setCurrentSession: (sessionId) => {
    if (!sessionId) {
      set({ currentSession: null });
      return;
    }
    // Search in store's sessions (includes newly created ones), not just mock data
    const session = get().sessions.find((s) => s.id === sessionId);
    set({ currentSession: session || null });
  },

  joinSession: (code) => {
    // Search in store's sessions (includes newly created ones)
    const session = get().sessions.find((s) => s.code === code.toUpperCase());
    if (session) {
      set({ currentSession: session });
    }
    return session || null;
  },

  createSession: (data) => {
    const newSession: Session = {
      id: `s${Date.now()}`,
      code: generateSessionCode(),
      name: data.name,
      date: data.date,
      time: data.time,
      mood: data.mood,
      constraints: data.constraints,
      status: 'voting',
      hostId: 'u1',
      participants: [{ id: 'u1', name: 'You', isHost: true, hasVoted: false }],
      venues: data.venues || [],
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      sessions: [...state.sessions, newSession],
      currentSession: newSession,
      activeSessions: [...state.activeSessions, newSession],
    }));

    return newSession;
  },

  vote: (sessionId, venueId) => {
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
              votedBy: [...venue.votedBy, 'u1'],
            };
          }),
          participants: session.participants.map((p) =>
            p.id === 'u1' ? { ...p, hasVoted: true } : p
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
                  votedBy: [...venue.votedBy, 'u1'],
                };
              }),
              participants: state.currentSession.participants.map((p) =>
                p.id === 'u1' ? { ...p, hasVoted: true } : p
              ),
            }
          : state.currentSession,
    }));
  },

  closeVoting: (sessionId) => {
    set((state) => {
      const session = state.sessions.find((s) => s.id === sessionId);
      if (!session) return state;

      // Find winner (most votes)
      const winner = session.venues.reduce((max, venue) =>
        venue.votes > max.votes ? venue : max
      );

      return {
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: 'confirmed' as const, winnerId: winner.venueId }
            : s
        ),
        currentSession:
          state.currentSession?.id === sessionId
            ? { ...state.currentSession, status: 'confirmed' as const, winnerId: winner.venueId }
            : state.currentSession,
      };
    });
  },

  refreshActiveSessions: () => {
    set({ activeSessions: getActiveSessions() });
  },

  addVenueToSession: (sessionId, venue) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session || session.venues.length >= 10) {
      return false;
    }

    // Check if venue already exists
    if (session.venues.some((v) => v.venueId === venue.venueId)) {
      return false;
    }

    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, venues: [...s.venues, venue] } : s
      ),
      currentSession:
        state.currentSession?.id === sessionId
          ? { ...state.currentSession, venues: [...state.currentSession.venues, venue] }
          : state.currentSession,
    }));

    return true;
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
    // Return sessions where user is a participant (for now, user is 'u1')
    return get().sessions.filter((s) => s.participants.some((p) => p.id === 'u1'));
  },
}));
