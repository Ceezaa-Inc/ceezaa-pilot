export type Reaction = 'loved' | 'good' | 'meh' | 'never_again';
export type VisitSource = 'transaction' | 'manual';
export type StatusFilter = 'all' | 'visited' | 'review';

export interface Visit {
  id: string;
  venueId: string;
  venueName: string;
  venueType: string;
  date: string;
  amount?: number;
  reaction?: Reaction; // Optional - undefined means needs review
  notes?: string;
  photos?: string[];
  source?: VisitSource;
}

export interface Place {
  venueId: string;
  venueName: string;
  venueType: string;
  visitCount: number;
  lastVisit: string;
  totalSpent: number;
  reaction?: Reaction; // Optional - undefined means needs review
  visits: Visit[];
}

export const VISITS: Visit[] = [
  {
    id: 'v1',
    venueId: '1',
    venueName: 'Bella Italia',
    venueType: 'Italian',
    date: '2024-12-10',
    amount: 85,
    reaction: 'loved',
    notes: 'Amazing carbonara! Will definitely come back.',
    source: 'transaction',
  },
  {
    id: 'v2',
    venueId: '1',
    venueName: 'Bella Italia',
    venueType: 'Italian',
    date: '2024-11-28',
    amount: 72,
    reaction: 'loved',
    source: 'transaction',
  },
  {
    id: 'v3',
    venueId: '1',
    venueName: 'Bella Italia',
    venueType: 'Italian',
    date: '2024-11-15',
    amount: 95,
    reaction: 'loved',
    notes: 'Great wine selection',
    source: 'transaction',
  },
  {
    id: 'v4',
    venueId: '1',
    venueName: 'Bella Italia',
    venueType: 'Italian',
    date: '2024-10-22',
    amount: 68,
    reaction: 'good',
    source: 'transaction',
  },
  {
    id: 'v5',
    venueId: '1',
    venueName: 'Bella Italia',
    venueType: 'Italian',
    date: '2024-09-30',
    amount: 78,
    reaction: 'loved',
    source: 'transaction',
  },
  {
    id: 'v6',
    venueId: '2',
    venueName: 'The Cozy Corner',
    venueType: 'American',
    date: '2024-12-08',
    amount: 32,
    reaction: 'good',
    notes: 'Good brunch spot for work meetings',
    source: 'transaction',
  },
  {
    id: 'v7',
    venueId: '2',
    venueName: 'The Cozy Corner',
    venueType: 'American',
    date: '2024-11-20',
    amount: 28,
    reaction: 'good',
    source: 'transaction',
  },
  {
    id: 'v8',
    venueId: '2',
    venueName: 'The Cozy Corner',
    venueType: 'American',
    date: '2024-10-15',
    amount: 35,
    reaction: 'good',
    source: 'transaction',
  },
  {
    id: 'v9',
    venueId: '3',
    venueName: 'Sakura Sushi',
    venueType: 'Japanese',
    date: '2024-12-05',
    amount: 120,
    reaction: 'loved',
    notes: 'Best omakase in the city!',
    source: 'transaction',
  },
  {
    id: 'v10',
    venueId: '3',
    venueName: 'Sakura Sushi',
    venueType: 'Japanese',
    date: '2024-11-10',
    amount: 95,
    reaction: 'loved',
    source: 'transaction',
  },
  {
    id: 'v11',
    venueId: '11',
    venueName: 'Taco Truck Express',
    venueType: 'Mexican',
    date: '2024-12-11',
    amount: 15,
    reaction: 'meh',
    notes: 'Too crowded, tacos were cold',
    source: 'transaction',
  },
  {
    id: 'v12',
    venueId: '14',
    venueName: 'Burger Bliss',
    venueType: 'American',
    date: '2024-12-01',
    amount: 22,
    reaction: 'never_again',
    notes: 'Food poisoning. Never going back.',
    source: 'transaction',
  },
  // Unrated visits - pending review (from recent transactions)
  {
    id: 'v13',
    venueId: '5',
    venueName: 'The Rooftop',
    venueType: 'American',
    date: '2024-12-12',
    amount: 85,
    source: 'transaction',
    // No reaction - needs review
  },
  {
    id: 'v14',
    venueId: '7',
    venueName: 'Green Garden',
    venueType: 'Vegan',
    date: '2024-12-13',
    amount: 42,
    source: 'transaction',
    // No reaction - needs review
  },
];

// Helper to check if a place has unrated visits
export const hasUnratedVisits = (place: Place): boolean => {
  return place.visits.some((v) => !v.reaction);
};

// Helper to check if a place is rated
export const isPlaceRated = (place: Place): boolean => {
  return place.reaction !== undefined;
};

// Aggregate visits into places
export const PLACES: Place[] = [
  {
    venueId: '1',
    venueName: 'Bella Italia',
    venueType: 'Italian',
    visitCount: 5,
    lastVisit: '2024-12-10',
    totalSpent: 398,
    reaction: 'loved',
    visits: VISITS.filter((v) => v.venueId === '1'),
  },
  {
    venueId: '2',
    venueName: 'The Cozy Corner',
    venueType: 'American',
    visitCount: 3,
    lastVisit: '2024-12-08',
    totalSpent: 95,
    reaction: 'good',
    visits: VISITS.filter((v) => v.venueId === '2'),
  },
  {
    venueId: '3',
    venueName: 'Sakura Sushi',
    venueType: 'Japanese',
    visitCount: 2,
    lastVisit: '2024-12-05',
    totalSpent: 215,
    reaction: 'loved',
    visits: VISITS.filter((v) => v.venueId === '3'),
  },
  {
    venueId: '11',
    venueName: 'Taco Truck Express',
    venueType: 'Mexican',
    visitCount: 1,
    lastVisit: '2024-12-11',
    totalSpent: 15,
    reaction: 'meh',
    visits: VISITS.filter((v) => v.venueId === '11'),
  },
  {
    venueId: '14',
    venueName: 'Burger Bliss',
    venueType: 'American',
    visitCount: 1,
    lastVisit: '2024-12-01',
    totalSpent: 22,
    reaction: 'never_again',
    visits: VISITS.filter((v) => v.venueId === '14'),
  },
  // Unrated places - pending review
  {
    venueId: '5',
    venueName: 'The Rooftop',
    venueType: 'American',
    visitCount: 1,
    lastVisit: '2024-12-12',
    totalSpent: 85,
    reaction: undefined, // Needs review
    visits: VISITS.filter((v) => v.venueId === '5'),
  },
  {
    venueId: '7',
    venueName: 'Green Garden',
    venueType: 'Vegan',
    visitCount: 1,
    lastVisit: '2024-12-13',
    totalSpent: 42,
    reaction: undefined, // Needs review
    visits: VISITS.filter((v) => v.venueId === '7'),
  },
];

export const getPlaceById = (venueId: string): Place | undefined => {
  return PLACES.find((place) => place.venueId === venueId);
};

export const getPlacesByReaction = (reaction: Reaction): Place[] => {
  return PLACES.filter((place) => place.reaction === reaction);
};

export const getPlacesByStatus = (places: Place[], status: StatusFilter): Place[] => {
  switch (status) {
    case 'all':
      return places;
    case 'visited':
      return places.filter((place) => isPlaceRated(place));
    case 'review':
      return places.filter((place) => !isPlaceRated(place) || hasUnratedVisits(place));
    default:
      return places;
  }
};

export const getReactionEmoji = (reaction: Reaction): string => {
  const emojis: Record<Reaction, string> = {
    loved: '❤️',
    good: '👍',
    meh: '😐',
    never_again: '👎',
  };
  return emojis[reaction];
};

export const getReactionLabel = (reaction: Reaction): string => {
  const labels: Record<Reaction, string> = {
    loved: 'Loved',
    good: 'Good',
    meh: 'Meh',
    never_again: 'Never Again',
  };
  return labels[reaction];
};

export const VAULT_STATS = {
  totalPlaces: PLACES.length,
  totalVisits: VISITS.length,
  totalSpentThisMonth: 680,
};
