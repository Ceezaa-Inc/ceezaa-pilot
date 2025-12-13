import { act } from '@testing-library/react-native';
import { useSessionStore } from './useSessionStore';
import { SESSIONS, getActiveSessions } from '@/mocks/sessions';

describe('useSessionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSessionStore.setState({
      sessions: SESSIONS,
      currentSession: null,
      activeSessions: getActiveSessions(),
      isLoading: false,
    });
  });

  describe('initial state', () => {
    it('should have sessions loaded', () => {
      const state = useSessionStore.getState();
      expect(state.sessions.length).toBeGreaterThan(0);
    });

    it('should have no current session initially', () => {
      const state = useSessionStore.getState();
      expect(state.currentSession).toBeNull();
    });

    it('should have active sessions', () => {
      const state = useSessionStore.getState();
      expect(state.activeSessions.length).toBeGreaterThanOrEqual(0);
    });

    it('should not be loading initially', () => {
      const state = useSessionStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setCurrentSession', () => {
    it('should set current session by ID', () => {
      const sessionId = SESSIONS[0].id;
      act(() => {
        useSessionStore.getState().setCurrentSession(sessionId);
      });
      expect(useSessionStore.getState().currentSession?.id).toBe(sessionId);
    });

    it('should clear current session when null is passed', () => {
      act(() => {
        useSessionStore.getState().setCurrentSession(SESSIONS[0].id);
      });
      expect(useSessionStore.getState().currentSession).not.toBeNull();

      act(() => {
        useSessionStore.getState().setCurrentSession(null);
      });
      expect(useSessionStore.getState().currentSession).toBeNull();
    });
  });

  describe('joinSession', () => {
    it('should join session by code', () => {
      const session = SESSIONS[0];
      let joinedSession: any;

      act(() => {
        joinedSession = useSessionStore.getState().joinSession(session.code);
      });

      expect(joinedSession).not.toBeNull();
      expect(joinedSession?.code).toBe(session.code);
      expect(useSessionStore.getState().currentSession?.code).toBe(session.code);
    });

    it('should return null for invalid code', () => {
      let joinedSession: any;

      act(() => {
        joinedSession = useSessionStore.getState().joinSession('INVALID');
      });

      expect(joinedSession).toBeNull();
    });

    it('should be case insensitive', () => {
      const session = SESSIONS[0];
      let joinedSession: any;

      act(() => {
        joinedSession = useSessionStore.getState().joinSession(session.code.toLowerCase());
      });

      expect(joinedSession).not.toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const initialCount = useSessionStore.getState().sessions.length;

      let newSession: any;
      act(() => {
        newSession = useSessionStore.getState().createSession({
          name: 'Test Dinner',
          date: '2024-12-25',
          time: '7:00 PM',
          mood: 'romantic',
        });
      });

      const state = useSessionStore.getState();
      expect(state.sessions.length).toBe(initialCount + 1);
      expect(newSession.name).toBe('Test Dinner');
      expect(newSession.mood).toBe('romantic');
      expect(newSession.status).toBe('voting');
      expect(newSession.code).toHaveLength(6);
    });

    it('should set new session as current session', () => {
      act(() => {
        useSessionStore.getState().createSession({
          name: 'New Session',
          date: '2024-12-26',
          time: '6:00 PM',
        });
      });

      expect(useSessionStore.getState().currentSession?.name).toBe('New Session');
    });
  });

  describe('vote', () => {
    it('should increment vote count for venue', () => {
      // First set a session with venues
      const sessionWithVenues = SESSIONS.find((s) => s.venues.length > 0);
      if (!sessionWithVenues) return;

      act(() => {
        useSessionStore.getState().setCurrentSession(sessionWithVenues.id);
      });

      const venueId = sessionWithVenues.venues[0].venueId;
      const initialVotes = sessionWithVenues.venues[0].votes;

      act(() => {
        useSessionStore.getState().vote(sessionWithVenues.id, venueId);
      });

      const state = useSessionStore.getState();
      const session = state.sessions.find((s) => s.id === sessionWithVenues.id);
      const venue = session?.venues.find((v) => v.venueId === venueId);
      expect(venue?.votes).toBe(initialVotes + 1);
    });

    it('should mark user as voted', () => {
      const sessionWithVenues = SESSIONS.find((s) => s.venues.length > 0);
      if (!sessionWithVenues) return;

      act(() => {
        useSessionStore.getState().setCurrentSession(sessionWithVenues.id);
      });

      act(() => {
        useSessionStore.getState().vote(sessionWithVenues.id, sessionWithVenues.venues[0].venueId);
      });

      const currentSession = useSessionStore.getState().currentSession;
      const userParticipant = currentSession?.participants.find((p) => p.id === 'u1');
      expect(userParticipant?.hasVoted).toBe(true);
    });
  });

  describe('closeVoting', () => {
    it('should change session status to confirmed', () => {
      const sessionWithVenues = SESSIONS.find((s) => s.venues.length > 0 && s.status === 'voting');
      if (!sessionWithVenues) return;

      act(() => {
        useSessionStore.getState().closeVoting(sessionWithVenues.id);
      });

      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionWithVenues.id);
      expect(session?.status).toBe('confirmed');
    });

    it('should set winner venue', () => {
      const sessionWithVenues = SESSIONS.find((s) => s.venues.length > 0 && s.status === 'voting');
      if (!sessionWithVenues) return;

      act(() => {
        useSessionStore.getState().closeVoting(sessionWithVenues.id);
      });

      const session = useSessionStore.getState().sessions.find((s) => s.id === sessionWithVenues.id);
      expect(session?.winnerId).toBeDefined();
    });
  });

  describe('refreshActiveSessions', () => {
    it('should refresh active sessions', () => {
      act(() => {
        useSessionStore.getState().refreshActiveSessions();
      });

      const activeSessions = useSessionStore.getState().activeSessions;
      activeSessions.forEach((session) => {
        expect(['voting', 'confirmed']).toContain(session.status);
      });
    });
  });
});
