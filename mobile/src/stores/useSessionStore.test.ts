import { act } from '@testing-library/react-native';
import { useSessionStore } from './useSessionStore';
import { sessionsApi, usersApi } from '@/services/api';

// Mock the API modules
jest.mock('@/services/api', () => ({
  sessionsApi: {
    getSessions: jest.fn(),
    getSession: jest.fn(),
    createSession: jest.fn(),
    joinSession: jest.fn(),
    vote: jest.fn(),
    closeVoting: jest.fn(),
    addVenue: jest.fn(),
    getInvitations: jest.fn(),
    respondToInvitation: jest.fn(),
    sendInvitations: jest.fn(),
  },
  usersApi: {
    search: jest.fn(),
  },
}));

const mockApiSession = {
  id: 'session-1',
  code: 'ABC123',
  title: 'Test Session',
  planned_date: '2024-12-25',
  planned_time: '7:00 PM',
  status: 'voting',
  host_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  participants: [
    { user_id: 'user-1', name: 'Host User', avatar: null, is_host: true, has_voted: false },
    { user_id: 'user-2', name: 'Guest User', avatar: null, is_host: false, has_voted: false },
  ],
  venues: [
    {
      venue_id: 'venue-1',
      venue_name: 'Test Venue',
      venue_type: 'restaurant',
      photo_url: null,
      votes: 0,
      voted_by: [],
    },
  ],
  winner_id: null,
};

describe('useSessionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSessionStore.setState({
      sessions: [],
      currentSession: null,
      activeSessions: [],
      pastSessions: [],
      pendingInvitations: [],
      isLoading: false,
      isLoadingInvitations: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty sessions initially', () => {
      const state = useSessionStore.getState();
      expect(state.sessions).toEqual([]);
    });

    it('should have no current session initially', () => {
      const state = useSessionStore.getState();
      expect(state.currentSession).toBeNull();
    });

    it('should have empty active sessions initially', () => {
      const state = useSessionStore.getState();
      expect(state.activeSessions).toEqual([]);
    });

    it('should not be loading initially', () => {
      const state = useSessionStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setCurrentSession', () => {
    it('should set current session by ID when session exists', () => {
      // Pre-populate sessions
      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            code: 'ABC123',
            name: 'Test Session',
            date: '2024-12-25',
            time: '7:00 PM',
            status: 'voting',
            hostId: 'user-1',
            participants: [],
            venues: [],
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      act(() => {
        useSessionStore.getState().setCurrentSession('session-1');
      });

      expect(useSessionStore.getState().currentSession?.id).toBe('session-1');
    });

    it('should clear current session when null is passed', () => {
      useSessionStore.setState({
        currentSession: {
          id: 'session-1',
          code: 'ABC123',
          name: 'Test Session',
          date: '2024-12-25',
          time: '7:00 PM',
          status: 'voting',
          hostId: 'user-1',
          participants: [],
          venues: [],
          createdAt: '2024-01-01T00:00:00Z',
        },
      });

      act(() => {
        useSessionStore.getState().setCurrentSession(null);
      });

      expect(useSessionStore.getState().currentSession).toBeNull();
    });
  });

  describe('joinSession', () => {
    it('should join session by code', async () => {
      (sessionsApi.joinSession as jest.Mock).mockResolvedValue(mockApiSession);

      let joinedSession: any;
      await act(async () => {
        joinedSession = await useSessionStore.getState().joinSession('ABC123', 'user-1');
      });

      expect(joinedSession).not.toBeNull();
      expect(joinedSession?.code).toBe('ABC123');
      expect(useSessionStore.getState().currentSession?.code).toBe('ABC123');
      expect(sessionsApi.joinSession).toHaveBeenCalledWith('ABC123', 'user-1');
    });

    it('should return null for failed join', async () => {
      (sessionsApi.joinSession as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      let joinedSession: any;
      await act(async () => {
        joinedSession = await useSessionStore.getState().joinSession('INVALID', 'user-1');
      });

      expect(joinedSession).toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      (sessionsApi.createSession as jest.Mock).mockResolvedValue(mockApiSession);

      let newSession: any;
      await act(async () => {
        newSession = await useSessionStore.getState().createSession('user-1', {
          name: 'Test Session',
          date: '2024-12-25',
          time: '7:00 PM',
        });
      });

      expect(newSession.name).toBe('Test Session');
      expect(newSession.status).toBe('voting');
      expect(sessionsApi.createSession).toHaveBeenCalledWith('user-1', {
        title: 'Test Session',
        planned_date: '2024-12-25',
        planned_time: '7:00 PM',
      });
    });

    it('should set new session as current session', async () => {
      (sessionsApi.createSession as jest.Mock).mockResolvedValue(mockApiSession);

      await act(async () => {
        await useSessionStore.getState().createSession('user-1', {
          name: 'Test Session',
        });
      });

      expect(useSessionStore.getState().currentSession?.name).toBe('Test Session');
    });

    it('should throw error when name is missing', async () => {
      await expect(
        useSessionStore.getState().createSession('user-1', { name: '' })
      ).rejects.toThrow('Session data is required with a name');
    });
  });

  describe('vote', () => {
    it('should optimistically update vote count', async () => {
      const sessionWithVenue = {
        ...mockApiSession,
        venues: [{ ...mockApiSession.venues[0], votes: 1, voted_by: ['user-1'] }],
        participants: [{ ...mockApiSession.participants[0], has_voted: true }],
      };

      (sessionsApi.vote as jest.Mock).mockResolvedValue(sessionWithVenue);

      // Set up initial state
      useSessionStore.setState({
        currentSession: {
          id: 'session-1',
          code: 'ABC123',
          name: 'Test Session',
          date: '2024-12-25',
          time: '7:00 PM',
          status: 'voting',
          hostId: 'user-1',
          participants: [
            { id: 'user-1', name: 'Host User', isHost: true, hasVoted: false },
          ],
          venues: [
            { venueId: 'venue-1', venueName: 'Test Venue', venueType: 'restaurant', votes: 0, votedBy: [] },
          ],
          createdAt: '2024-01-01T00:00:00Z',
        },
        sessions: [],
      });

      await act(async () => {
        await useSessionStore.getState().vote('session-1', 'venue-1', 'user-1');
      });

      const currentSession = useSessionStore.getState().currentSession;
      const venue = currentSession?.venues.find((v) => v.venueId === 'venue-1');
      expect(venue?.votes).toBe(1);
    });
  });

  describe('closeVoting', () => {
    it('should change session status to confirmed', async () => {
      const confirmedSession = {
        ...mockApiSession,
        status: 'confirmed',
        winner_id: 'venue-1',
      };

      (sessionsApi.closeVoting as jest.Mock).mockResolvedValue(confirmedSession);

      useSessionStore.setState({
        sessions: [
          {
            id: 'session-1',
            code: 'ABC123',
            name: 'Test Session',
            date: '2024-12-25',
            time: '7:00 PM',
            status: 'voting',
            hostId: 'user-1',
            participants: [],
            venues: [],
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        activeSessions: [],
        pastSessions: [],
      });

      await act(async () => {
        await useSessionStore.getState().closeVoting('session-1', 'user-1');
      });

      const session = useSessionStore.getState().sessions.find((s) => s.id === 'session-1');
      expect(session?.status).toBe('confirmed');
      expect(session?.winnerId).toBe('venue-1');
    });
  });

  describe('fetchInvitations', () => {
    it('should fetch pending invitations', async () => {
      const mockInvitations = [
        {
          id: 'inv-1',
          session_id: 'session-1',
          session_title: 'Test Session',
          session_date: '2024-12-25',
          inviter_name: 'Test User',
          inviter_avatar: null,
          participant_count: 2,
          venue_count: 1,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (sessionsApi.getInvitations as jest.Mock).mockResolvedValue({ invitations: mockInvitations });

      await act(async () => {
        await useSessionStore.getState().fetchInvitations('user-1');
      });

      expect(useSessionStore.getState().pendingInvitations).toHaveLength(1);
      expect(useSessionStore.getState().pendingInvitations[0].id).toBe('inv-1');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and return session', async () => {
      (sessionsApi.respondToInvitation as jest.Mock).mockResolvedValue(mockApiSession);

      useSessionStore.setState({
        pendingInvitations: [
          {
            id: 'inv-1',
            session_id: 'session-1',
            session_title: 'Test Session',
            session_date: '2024-12-25',
            inviter_name: 'Test User',
            inviter_avatar: null,
            participant_count: 2,
            venue_count: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      });

      let session: any;
      await act(async () => {
        session = await useSessionStore.getState().acceptInvitation('inv-1', 'user-1');
      });

      expect(session).not.toBeNull();
      expect(session?.id).toBe('session-1');
      expect(useSessionStore.getState().pendingInvitations).toHaveLength(0);
    });
  });

  describe('declineInvitation', () => {
    it('should decline invitation and remove from pending', async () => {
      (sessionsApi.respondToInvitation as jest.Mock).mockResolvedValue({ success: true });

      useSessionStore.setState({
        pendingInvitations: [
          {
            id: 'inv-1',
            session_id: 'session-1',
            session_title: 'Test Session',
            session_date: '2024-12-25',
            inviter_name: 'Test User',
            inviter_avatar: null,
            participant_count: 2,
            venue_count: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      });

      let result: boolean;
      await act(async () => {
        result = await useSessionStore.getState().declineInvitation('inv-1', 'user-1');
      });

      expect(result!).toBe(true);
      expect(useSessionStore.getState().pendingInvitations).toHaveLength(0);
    });
  });

  describe('searchUsers', () => {
    it('should search users by username', async () => {
      const mockUsers = [
        { id: 'user-1', username: 'testuser', display_name: 'Test User', avatar_url: null },
      ];

      (usersApi.search as jest.Mock).mockResolvedValue({ users: mockUsers });

      let users: any[];
      await act(async () => {
        users = await useSessionStore.getState().searchUsers('test', 'username');
      });

      expect(users!).toHaveLength(1);
      expect(users![0].username).toBe('testuser');
      expect(usersApi.search).toHaveBeenCalledWith('test', 'username');
    });
  });
});
