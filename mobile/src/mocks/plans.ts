export interface SavedPlan {
  id: string;
  name: string;
  date: string;
  time: string;
  venueId: string;
  venueName: string;
  participants: string[];
  status: 'upcoming' | 'completed' | 'cancelled';
}

export const SAVED_PLANS: SavedPlan[] = [
  {
    id: 'plan1',
    name: 'Friday Dinner',
    date: '2024-12-20',
    time: '7:30 PM',
    venueId: '1',
    venueName: 'Bella Italia',
    participants: ['You', 'Alex', 'Jordan'],
    status: 'upcoming',
  },
  {
    id: 'plan2',
    name: 'Birthday Brunch',
    date: '2024-12-22',
    time: '11:00 AM',
    venueId: '18',
    venueName: 'Breakfast Club',
    participants: ['You', 'Sam', 'Taylor', 'Morgan'],
    status: 'upcoming',
  },
  {
    id: 'plan3',
    name: 'Date Night',
    date: '2024-12-28',
    time: '8:00 PM',
    venueId: '6',
    venueName: 'Le Petit Bistro',
    participants: ['You', 'Partner'],
    status: 'upcoming',
  },
];

export const getPlanById = (id: string): SavedPlan | undefined => {
  return SAVED_PLANS.find((plan) => plan.id === id);
};

export const getUpcomingPlans = (limit = 3): SavedPlan[] => {
  return SAVED_PLANS.filter((plan) => plan.status === 'upcoming').slice(0, limit);
};
