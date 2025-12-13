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
  venueType: string;
  matchPercentage: number;
  votes: number;
  votedBy: string[];
}

export interface Session {
  id: string;
  code: string;
  name: string;
  date: string;
  time: string;
  mood?: string;
  constraints?: string[];
  status: SessionStatus;
  hostId: string;
  participants: Participant[];
  venues: SessionVenue[];
  winnerId?: string;
  createdAt: string;
}

export const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'u1', name: 'You', isHost: true, hasVoted: true },
  { id: 'u2', name: 'Sarah', isHost: false, hasVoted: true },
  { id: 'u3', name: 'Mike', isHost: false, hasVoted: false },
  { id: 'u4', name: 'Emma', isHost: false, hasVoted: true },
];

export const SESSIONS: Session[] = [
  {
    id: 's1',
    code: 'PIZZA123',
    name: 'Friday Night Dinner',
    date: '2024-12-15',
    time: '7:00 PM',
    mood: 'social',
    constraints: ['Budget-friendly', 'Vegetarian options'],
    status: 'voting',
    hostId: 'u1',
    participants: MOCK_PARTICIPANTS,
    venues: [
      {
        venueId: '1',
        venueName: 'Bella Italia',
        venueType: 'Italian',
        matchPercentage: 94,
        votes: 2,
        votedBy: ['u1', 'u4'],
      },
      {
        venueId: '5',
        venueName: 'Mama Rosa',
        venueType: 'Mexican',
        matchPercentage: 85,
        votes: 1,
        votedBy: ['u2'],
      },
      {
        venueId: '15',
        venueName: 'Thai Orchid',
        venueType: 'Thai',
        matchPercentage: 86,
        votes: 0,
        votedBy: [],
      },
    ],
    createdAt: '2024-12-13T10:00:00Z',
  },
  {
    id: 's2',
    code: 'BRUNCH99',
    name: 'Sunday Brunch',
    date: '2024-12-17',
    time: '11:00 AM',
    mood: 'cozy',
    status: 'confirmed',
    hostId: 'u2',
    participants: [
      { id: 'u1', name: 'You', isHost: false, hasVoted: true },
      { id: 'u2', name: 'Sarah', isHost: true, hasVoted: true },
      { id: 'u5', name: 'Lisa', isHost: false, hasVoted: true },
    ],
    venues: [
      {
        venueId: '18',
        venueName: 'Breakfast Club',
        venueType: 'Cafe',
        matchPercentage: 85,
        votes: 3,
        votedBy: ['u1', 'u2', 'u5'],
      },
      {
        venueId: '2',
        venueName: 'The Cozy Corner',
        venueType: 'Cafe',
        matchPercentage: 89,
        votes: 0,
        votedBy: [],
      },
    ],
    winnerId: '18',
    createdAt: '2024-12-12T14:00:00Z',
  },
  {
    id: 's3',
    code: 'DATE456',
    name: 'Anniversary Dinner',
    date: '2024-12-20',
    time: '8:00 PM',
    mood: 'romantic',
    constraints: ['Fine dining', 'Quiet atmosphere'],
    status: 'completed',
    hostId: 'u1',
    participants: [
      { id: 'u1', name: 'You', isHost: true, hasVoted: true },
      { id: 'u6', name: 'Partner', isHost: false, hasVoted: true },
    ],
    venues: [
      {
        venueId: '6',
        venueName: 'Le Petit Bistro',
        venueType: 'French',
        matchPercentage: 91,
        votes: 2,
        votedBy: ['u1', 'u6'],
      },
    ],
    winnerId: '6',
    createdAt: '2024-12-10T09:00:00Z',
  },
];

export const getSessionById = (id: string): Session | undefined => {
  return SESSIONS.find((session) => session.id === id);
};

export const getSessionByCode = (code: string): Session | undefined => {
  return SESSIONS.find((session) => session.code === code);
};

export const getActiveSessions = (): Session[] => {
  return SESSIONS.filter((session) => session.status === 'voting' || session.status === 'confirmed');
};

export const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
