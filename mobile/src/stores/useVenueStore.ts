import { create } from 'zustand';
import { Venue, VENUES, getVenueById, getVenuesByMood, getTopMatches } from '@/mocks/venues';
import { MoodType } from '@/mocks/taste';

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  filteredVenues: Venue[];
  currentMood: MoodType | null;
  isLoading: boolean;

  // Actions
  setSelectedVenue: (venueId: string | null) => void;
  filterByMood: (mood: MoodType) => void;
  clearFilter: () => void;
  getTopMatches: (limit?: number) => Venue[];
}

export const useVenueStore = create<VenueState>((set, get) => ({
  venues: VENUES,
  selectedVenue: null,
  filteredVenues: VENUES,
  currentMood: null,
  isLoading: false,

  setSelectedVenue: (venueId) => {
    if (!venueId) {
      set({ selectedVenue: null });
      return;
    }
    const venue = getVenueById(venueId);
    set({ selectedVenue: venue || null });
  },

  filterByMood: (mood) => {
    const filtered = getVenuesByMood(mood);
    set({ filteredVenues: filtered, currentMood: mood });
  },

  clearFilter: () => {
    set({ filteredVenues: VENUES, currentMood: null });
  },

  getTopMatches: (limit = 5) => {
    return getTopMatches(limit);
  },
}));
