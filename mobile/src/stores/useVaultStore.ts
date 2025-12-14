import { create } from 'zustand';
import {
  Place,
  Visit,
  Reaction,
  StatusFilter,
  VisitSource,
  PLACES,
  VISITS,
  VAULT_STATS,
  getPlaceById,
  getPlacesByStatus,
  isPlaceRated,
  hasUnratedVisits,
} from '@/mocks/visits';

interface AddVisitData {
  venueId: string;
  venueName: string;
  venueType: string;
  date: string;
  amount?: number;
  reaction?: Reaction;
  notes?: string;
  source?: VisitSource;
}

interface VaultState {
  places: Place[];
  visits: Visit[];
  selectedPlace: Place | null;
  currentFilter: StatusFilter;
  filteredPlaces: Place[];
  stats: typeof VAULT_STATS;

  // Actions
  setSelectedPlace: (venueId: string | null) => void;
  setFilter: (filter: StatusFilter) => void;
  updateReaction: (venueId: string, reaction: Reaction) => void;
  addNote: (visitId: string, note: string) => void;
  addVisit: (data: AddVisitData) => void;
  rateVisit: (visitId: string, reaction: Reaction) => void;
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
    // Search in store's places array (not static PLACES) to find dynamically added places
    const { places } = get();
    const place = places.find((p) => p.venueId === venueId);
    set({ selectedPlace: place || null });
  },

  setFilter: (filter) => {
    const { places } = get();
    const filtered = getPlacesByStatus(places, filter);
    set({ filteredPlaces: filtered, currentFilter: filter });
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

  addVisit: (data) => {
    const newVisit: Visit = {
      id: `v${Date.now()}`,
      venueId: data.venueId,
      venueName: data.venueName,
      venueType: data.venueType,
      date: data.date,
      amount: data.amount,
      reaction: data.reaction,
      notes: data.notes,
      source: data.source || 'manual',
    };

    set((state) => {
      const existingPlace = state.places.find((p) => p.venueId === data.venueId);
      let updatedPlaces: Place[];

      if (existingPlace) {
        // Update existing place
        updatedPlaces = state.places.map((place) =>
          place.venueId === data.venueId
            ? {
                ...place,
                visitCount: place.visitCount + 1,
                lastVisit: data.date > place.lastVisit ? data.date : place.lastVisit,
                totalSpent: place.totalSpent + (data.amount || 0),
                visits: [newVisit, ...place.visits],
                reaction: data.reaction || place.reaction,
              }
            : place
        );
      } else {
        // Create new place
        const newPlace: Place = {
          venueId: data.venueId,
          venueName: data.venueName,
          venueType: data.venueType,
          visitCount: 1,
          lastVisit: data.date,
          totalSpent: data.amount || 0,
          reaction: data.reaction,
          visits: [newVisit],
        };
        updatedPlaces = [newPlace, ...state.places];
      }

      const { currentFilter } = state;
      const filtered = getPlacesByStatus(updatedPlaces, currentFilter);

      return {
        visits: [newVisit, ...state.visits],
        places: updatedPlaces,
        filteredPlaces: filtered,
        stats: {
          ...state.stats,
          totalPlaces: updatedPlaces.length,
          totalVisits: state.visits.length + 1,
        },
      };
    });
  },

  rateVisit: (visitId, reaction) => {
    set((state) => {
      // Find the visit and update it
      const updatedVisits = state.visits.map((visit) =>
        visit.id === visitId ? { ...visit, reaction } : visit
      );

      // Find which place this visit belongs to
      const visit = state.visits.find((v) => v.id === visitId);
      if (!visit) return state;

      // Update the place's visits and potentially its reaction
      const updatedPlaces = state.places.map((place) => {
        if (place.venueId !== visit.venueId) return place;

        const updatedPlaceVisits = place.visits.map((v) =>
          v.id === visitId ? { ...v, reaction } : v
        );

        // If place has no reaction yet, set it to this visit's reaction
        const placeReaction = place.reaction || reaction;

        return {
          ...place,
          visits: updatedPlaceVisits,
          reaction: placeReaction,
        };
      });

      const { currentFilter } = state;
      const filtered = getPlacesByStatus(updatedPlaces, currentFilter);

      // Update selectedPlace if we're viewing this place
      const selectedPlace = state.selectedPlace?.venueId === visit.venueId
        ? updatedPlaces.find((p) => p.venueId === visit.venueId) || null
        : state.selectedPlace;

      return {
        visits: updatedVisits,
        places: updatedPlaces,
        filteredPlaces: filtered,
        selectedPlace,
      };
    });
  },
}));
