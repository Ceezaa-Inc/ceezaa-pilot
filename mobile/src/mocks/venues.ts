export interface DayHours {
  open: string;
  close: string;
  closed?: boolean;
}

export interface VenueHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface Venue {
  id: string;
  name: string;
  type: string;
  cuisine?: string;
  priceLevel: 1 | 2 | 3 | 4;
  matchPercentage: number;
  rating: number;
  reviewCount: number;
  address: string;
  neighborhood: string;
  distance?: string;
  imageUrl?: string;
  tags: string[];
  moods: string[];
  hours: VenueHours;
  features: string[];
}

// Helper to create hours for all days
const createHours = (
  weekday: DayHours,
  weekend: DayHours,
  sunday?: DayHours
): VenueHours => ({
  monday: weekday,
  tuesday: weekday,
  wednesday: weekday,
  thursday: weekday,
  friday: weekend,
  saturday: weekend,
  sunday: sunday || weekend,
});

export const VENUES: Venue[] = [
  {
    id: '1',
    name: 'Bella Italia',
    type: 'Restaurant',
    cuisine: 'Italian',
    priceLevel: 3,
    matchPercentage: 94,
    rating: 4.7,
    reviewCount: 342,
    address: '123 Main Street',
    neighborhood: 'Downtown',
    distance: '0.3 mi',
    tags: ['Pasta', 'Wine', 'Date Night'],
    moods: ['romantic', 'cozy'],
    hours: createHours(
      { open: '11:00 AM', close: '10:00 PM' },
      { open: '11:00 AM', close: '11:00 PM' },
      { open: '12:00 PM', close: '9:00 PM' }
    ),
    features: ['Outdoor Seating', 'Reservations', 'Full Bar'],
  },
  {
    id: '2',
    name: 'The Cozy Corner',
    type: 'Cafe',
    cuisine: 'American',
    priceLevel: 2,
    matchPercentage: 89,
    rating: 4.5,
    reviewCount: 218,
    address: '456 Oak Avenue',
    neighborhood: 'Midtown',
    distance: '0.5 mi',
    tags: ['Brunch', 'Coffee', 'Comfort Food'],
    moods: ['cozy', 'chill'],
    hours: createHours(
      { open: '7:00 AM', close: '4:00 PM' },
      { open: '8:00 AM', close: '5:00 PM' },
      { open: '8:00 AM', close: '3:00 PM' }
    ),
    features: ['WiFi', 'Laptop Friendly', 'Pet Friendly'],
  },
  {
    id: '3',
    name: 'Sakura Sushi',
    type: 'Restaurant',
    cuisine: 'Japanese',
    priceLevel: 3,
    matchPercentage: 87,
    rating: 4.8,
    reviewCount: 456,
    address: '789 Cherry Lane',
    neighborhood: 'Little Tokyo',
    distance: '0.8 mi',
    tags: ['Sushi', 'Sake', 'Omakase'],
    moods: ['refined', 'adventurous'],
    hours: createHours(
      { open: '5:00 PM', close: '10:00 PM' },
      { open: '5:00 PM', close: '11:00 PM' },
      { open: '5:00 PM', close: '9:00 PM' }
    ),
    features: ['Sushi Bar', 'Private Rooms', 'BYOB'],
  },
  {
    id: '4',
    name: 'The Rooftop',
    type: 'Bar',
    cuisine: 'American',
    priceLevel: 3,
    matchPercentage: 92,
    rating: 4.4,
    reviewCount: 189,
    address: '101 Sky Tower',
    neighborhood: 'Financial District',
    distance: '1.2 mi',
    tags: ['Cocktails', 'Views', 'Happy Hour'],
    moods: ['social', 'energetic'],
    hours: createHours(
      { open: '4:00 PM', close: '12:00 AM' },
      { open: '2:00 PM', close: '2:00 AM' },
      { open: '2:00 PM', close: '10:00 PM' }
    ),
    features: ['Rooftop', 'DJ', 'Bottle Service'],
  },
  {
    id: '5',
    name: 'Mama Rosa',
    type: 'Restaurant',
    cuisine: 'Mexican',
    priceLevel: 2,
    matchPercentage: 85,
    rating: 4.6,
    reviewCount: 567,
    address: '234 Fiesta Street',
    neighborhood: 'West Side',
    distance: '0.7 mi',
    tags: ['Tacos', 'Margaritas', 'Family Style'],
    moods: ['social', 'energetic'],
    hours: createHours(
      { open: '11:00 AM', close: '10:00 PM' },
      { open: '11:00 AM', close: '11:00 PM' },
      { open: '10:00 AM', close: '9:00 PM' }
    ),
    features: ['Patio', 'Live Music', 'Kids Menu'],
  },
  {
    id: '6',
    name: 'Le Petit Bistro',
    type: 'Restaurant',
    cuisine: 'French',
    priceLevel: 4,
    matchPercentage: 91,
    rating: 4.9,
    reviewCount: 123,
    address: '567 Rue Avenue',
    neighborhood: 'Arts District',
    distance: '1.5 mi',
    tags: ['Fine Dining', 'Wine Pairing', 'Tasting Menu'],
    moods: ['romantic', 'refined'],
    hours: createHours(
      { open: '6:00 PM', close: '10:00 PM' },
      { open: '5:30 PM', close: '10:30 PM' },
      { open: '', close: '', closed: true }
    ),
    features: ['Prix Fixe', 'Sommelier', 'Valet'],
  },
  {
    id: '7',
    name: 'Green Garden',
    type: 'Restaurant',
    cuisine: 'Vegan',
    priceLevel: 2,
    matchPercentage: 78,
    rating: 4.3,
    reviewCount: 234,
    address: '890 Leaf Lane',
    neighborhood: 'Echo Park',
    distance: '2.1 mi',
    tags: ['Plant-Based', 'Organic', 'Healthy'],
    moods: ['chill', 'adventurous'],
    hours: createHours(
      { open: '9:00 AM', close: '9:00 PM' },
      { open: '9:00 AM', close: '10:00 PM' },
      { open: '10:00 AM', close: '8:00 PM' }
    ),
    features: ['Gluten-Free Options', 'Smoothies', 'Meditation Space'],
  },
  {
    id: '8',
    name: 'The Pub House',
    type: 'Bar',
    cuisine: 'British',
    priceLevel: 2,
    matchPercentage: 82,
    rating: 4.2,
    reviewCount: 345,
    address: '111 Ale Street',
    neighborhood: 'Old Town',
    distance: '0.4 mi',
    tags: ['Craft Beer', 'Fish & Chips', 'Sports'],
    moods: ['social', 'chill'],
    hours: createHours(
      { open: '12:00 PM', close: '12:00 AM' },
      { open: '11:00 AM', close: '2:00 AM' },
      { open: '11:00 AM', close: '11:00 PM' }
    ),
    features: ['TVs', 'Darts', 'Trivia Night'],
  },
  {
    id: '9',
    name: 'Spice Route',
    type: 'Restaurant',
    cuisine: 'Indian',
    priceLevel: 2,
    matchPercentage: 88,
    rating: 4.6,
    reviewCount: 289,
    address: '222 Curry Court',
    neighborhood: 'University District',
    distance: '1.8 mi',
    tags: ['Curry', 'Naan', 'Buffet'],
    moods: ['adventurous', 'social'],
    hours: createHours(
      { open: '11:30 AM', close: '10:00 PM' },
      { open: '11:30 AM', close: '10:30 PM' },
      { open: '12:00 PM', close: '9:30 PM' }
    ),
    features: ['Lunch Buffet', 'Vegetarian Options', 'Catering'],
  },
  {
    id: '10',
    name: 'Ocean Blue',
    type: 'Restaurant',
    cuisine: 'Seafood',
    priceLevel: 4,
    matchPercentage: 86,
    rating: 4.7,
    reviewCount: 178,
    address: '333 Harbor Drive',
    neighborhood: 'Waterfront',
    distance: '2.5 mi',
    tags: ['Fresh Catch', 'Oysters', 'Sunset Views'],
    moods: ['romantic', 'refined'],
    hours: createHours(
      { open: '4:00 PM', close: '10:00 PM' },
      { open: '12:00 PM', close: '11:00 PM' },
      { open: '12:00 PM', close: '9:00 PM' }
    ),
    features: ['Raw Bar', 'Waterfront Seating', 'Wine List'],
  },
  {
    id: '11',
    name: 'Taco Truck Express',
    type: 'Food Truck',
    cuisine: 'Mexican',
    priceLevel: 1,
    matchPercentage: 79,
    rating: 4.4,
    reviewCount: 892,
    address: 'Rotates - Check App',
    neighborhood: 'Various',
    distance: '0.2 mi',
    tags: ['Street Tacos', 'Quick Bite', 'Late Night'],
    moods: ['adventurous', 'chill'],
    hours: createHours(
      { open: '11:00 AM', close: '2:00 AM' },
      { open: '11:00 AM', close: '3:00 AM' },
      { open: '12:00 PM', close: '12:00 AM' }
    ),
    features: ['Cash Only', 'Standing Room', 'Salsa Bar'],
  },
  {
    id: '12',
    name: 'Noodle Paradise',
    type: 'Restaurant',
    cuisine: 'Chinese',
    priceLevel: 2,
    matchPercentage: 84,
    rating: 4.5,
    reviewCount: 456,
    address: '444 Dragon Street',
    neighborhood: 'Chinatown',
    distance: '1.1 mi',
    tags: ['Hand-Pulled Noodles', 'Dumplings', 'Family Style'],
    moods: ['cozy', 'social'],
    hours: createHours(
      { open: '11:00 AM', close: '10:00 PM' },
      { open: '11:00 AM', close: '10:30 PM' },
      { open: '11:00 AM', close: '9:30 PM' }
    ),
    features: ['Open Kitchen', 'Group Dining', 'BYO Wine'],
  },
  {
    id: '13',
    name: 'The Jazz Lounge',
    type: 'Bar',
    cuisine: 'American',
    priceLevel: 3,
    matchPercentage: 90,
    rating: 4.6,
    reviewCount: 167,
    address: '555 Blues Avenue',
    neighborhood: 'Music Row',
    distance: '1.3 mi',
    tags: ['Live Jazz', 'Cocktails', 'Date Night'],
    moods: ['romantic', 'chill'],
    hours: createHours(
      { open: '6:00 PM', close: '1:00 AM' },
      { open: '6:00 PM', close: '2:00 AM' },
      { open: '', close: '', closed: true }
    ),
    features: ['Live Music', 'Craft Cocktails', 'Dress Code'],
  },
  {
    id: '14',
    name: 'Burger Bliss',
    type: 'Restaurant',
    cuisine: 'American',
    priceLevel: 2,
    matchPercentage: 81,
    rating: 4.3,
    reviewCount: 678,
    address: '666 Grill Street',
    neighborhood: 'Suburb',
    distance: '3.2 mi',
    tags: ['Burgers', 'Shakes', 'Fries'],
    moods: ['chill', 'social'],
    hours: createHours(
      { open: '11:00 AM', close: '10:00 PM' },
      { open: '11:00 AM', close: '11:00 PM' },
      { open: '11:00 AM', close: '9:00 PM' }
    ),
    features: ['Drive-Through', 'Kids Play Area', 'Customizable'],
  },
  {
    id: '15',
    name: 'Thai Orchid',
    type: 'Restaurant',
    cuisine: 'Thai',
    priceLevel: 2,
    matchPercentage: 86,
    rating: 4.5,
    reviewCount: 312,
    address: '777 Lotus Lane',
    neighborhood: 'East Side',
    distance: '1.6 mi',
    tags: ['Pad Thai', 'Curry', 'Spicy'],
    moods: ['adventurous', 'cozy'],
    hours: createHours(
      { open: '11:30 AM', close: '10:00 PM' },
      { open: '11:30 AM', close: '10:30 PM' },
      { open: '12:00 PM', close: '9:00 PM' }
    ),
    features: ['Spice Level Options', 'Takeout', 'Delivery'],
  },
  {
    id: '16',
    name: 'Mediterranean Grill',
    type: 'Restaurant',
    cuisine: 'Mediterranean',
    priceLevel: 2,
    matchPercentage: 83,
    rating: 4.4,
    reviewCount: 234,
    address: '888 Olive Street',
    neighborhood: 'College Town',
    distance: '2.0 mi',
    tags: ['Kebabs', 'Hummus', 'Healthy'],
    moods: ['chill', 'social'],
    hours: createHours(
      { open: '11:00 AM', close: '9:00 PM' },
      { open: '11:00 AM', close: '10:00 PM' },
      { open: '12:00 PM', close: '8:00 PM' }
    ),
    features: ['Build Your Bowl', 'Catering', 'Quick Service'],
  },
  {
    id: '17',
    name: 'Steakhouse Prime',
    type: 'Restaurant',
    cuisine: 'Steakhouse',
    priceLevel: 4,
    matchPercentage: 88,
    rating: 4.8,
    reviewCount: 145,
    address: '999 Prime Road',
    neighborhood: 'Business District',
    distance: '1.9 mi',
    tags: ['Steak', 'Wine', 'Business Dinner'],
    moods: ['refined', 'social'],
    hours: createHours(
      { open: '5:00 PM', close: '10:00 PM' },
      { open: '5:00 PM', close: '11:00 PM' },
      { open: '4:00 PM', close: '9:00 PM' }
    ),
    features: ['Dry-Aged', 'Private Dining', 'Valet'],
  },
  {
    id: '18',
    name: 'Breakfast Club',
    type: 'Cafe',
    cuisine: 'American',
    priceLevel: 2,
    matchPercentage: 85,
    rating: 4.4,
    reviewCount: 423,
    address: '1010 Morning Lane',
    neighborhood: 'Residential',
    distance: '0.6 mi',
    tags: ['Brunch', 'Pancakes', 'Weekend Spot'],
    moods: ['cozy', 'social'],
    hours: createHours(
      { open: '7:00 AM', close: '2:00 PM' },
      { open: '7:00 AM', close: '3:00 PM' },
      { open: '8:00 AM', close: '3:00 PM' }
    ),
    features: ['Bottomless Mimosas', 'Outdoor Patio', 'Dog Friendly'],
  },
  {
    id: '19',
    name: 'Pizza Palace',
    type: 'Restaurant',
    cuisine: 'Italian',
    priceLevel: 2,
    matchPercentage: 80,
    rating: 4.2,
    reviewCount: 567,
    address: '1111 Slice Street',
    neighborhood: 'College Area',
    distance: '1.4 mi',
    tags: ['Pizza', 'Late Night', 'By the Slice'],
    moods: ['chill', 'social'],
    hours: createHours(
      { open: '11:00 AM', close: '1:00 AM' },
      { open: '11:00 AM', close: '3:00 AM' },
      { open: '12:00 PM', close: '12:00 AM' }
    ),
    features: ['By the Slice', 'Delivery', 'Beer & Wine'],
  },
  {
    id: '20',
    name: 'Zen Garden',
    type: 'Restaurant',
    cuisine: 'Japanese',
    priceLevel: 3,
    matchPercentage: 89,
    rating: 4.6,
    reviewCount: 198,
    address: '1212 Bamboo Way',
    neighborhood: 'Zen District',
    distance: '2.3 mi',
    tags: ['Ramen', 'Izakaya', 'Sake'],
    moods: ['cozy', 'adventurous'],
    hours: createHours(
      { open: '5:00 PM', close: '11:00 PM' },
      { open: '5:00 PM', close: '12:00 AM' },
      { open: '5:00 PM', close: '10:00 PM' }
    ),
    features: ['Sake Menu', 'Small Plates', 'Late Night'],
  },
];

export const getVenueById = (id: string): Venue | undefined => {
  return VENUES.find((venue) => venue.id === id);
};

export const getVenuesByMood = (mood: string): Venue[] => {
  return VENUES.filter((venue) => venue.moods.includes(mood.toLowerCase()));
};

export const getTopMatches = (limit = 5): Venue[] => {
  return [...VENUES].sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, limit);
};

// Helper to format hours for display
export const formatHoursForDisplay = (hours: VenueHours): { label: string; time: string }[] => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const result: { label: string; time: string }[] = [];
  let i = 0;

  while (i < days.length) {
    const currentDay = hours[days[i]];
    let endIdx = i;

    // Find consecutive days with same hours
    while (
      endIdx < days.length - 1 &&
      hours[days[endIdx + 1]].open === currentDay.open &&
      hours[days[endIdx + 1]].close === currentDay.close &&
      hours[days[endIdx + 1]].closed === currentDay.closed
    ) {
      endIdx++;
    }

    const label = i === endIdx ? dayLabels[i] : `${dayLabels[i]} - ${dayLabels[endIdx]}`;
    const time = currentDay.closed ? 'Closed' : `${currentDay.open} - ${currentDay.close}`;

    result.push({ label, time });
    i = endIdx + 1;
  }

  return result;
};
