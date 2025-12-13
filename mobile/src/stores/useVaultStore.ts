import { create } from 'zustand';
import {
  Place,
  Visit,
  Reaction,
  PLACES,
  VISITS,
  VAULT_STATS,
  getPlaceById,
  getPlacesByReaction,
} from '@/mocks/visits';

type FilterType = 'all' | Reaction;

interface VaultState {
  places: Place[];
  visits: Visit[];
  selectedPlace: Place | null;
  currentFilter: FilterType;
  filteredPlaces: Place[];
  stats: typeof VAULT_STATS;

  // Actions
  setSelectedPlace: (venueId: string | null) => void;
  setFilter: (filter: FilterType) => void;
  updateReaction: (venueId: string, reaction: Reaction) => void;
  addNote: (visitId: string, note: string) => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  places: PLACES,
  visits: VISITS,
  selectedPlace: null,
  currentFilter: 'all',
  filteredPlaces: PLACES,
  stats: VAULT_STATS,

  setSelectedPlace: (venueId) => {
    if (!venueId) {
      set({ selectedPlace: null });
      return;
    }
    const place = getPlaceById(venueId);
    set({ selectedPlace: place || null });
  },

  setFilter: (filter) => {
    if (filter === 'all') {
      set({ filteredPlaces: PLACES, currentFilter: 'all' });
    } else {
      const filtered = getPlacesByReaction(filter);
      set({ filteredPlaces: filtered, currentFilter: filter });
    }
  },

  updateReaction: (venueId, reaction) => {
    set((state) => ({
      places: state.places.map((place) =>
        place.venueId === venueId ? { ...place, reaction } : place
      ),
      filteredPlaces: state.filteredPlaces.map((place) =>
        place.venueId === venueId ? { ...place, reaction } : place
      ),
      selectedPlace:
        state.selectedPlace?.venueId === venueId
          ? { ...state.selectedPlace, reaction }
          : state.selectedPlace,
    }));
  },

  addNote: (visitId, note) => {
    set((state) => ({
      visits: state.visits.map((visit) =>
        visit.id === visitId ? { ...visit, notes: note } : visit
      ),
    }));
  },
}));
