import { create } from 'zustand';
import {
  vaultApi,
  VaultPlace,
  VaultVisit,
  CreateVisitRequest,
} from '@/services/api';

// Re-export types for components
export type Reaction = 'loved' | 'good' | 'meh' | 'never_again';
export type StatusFilter = 'all' | 'loved' | 'good' | 'meh' | 'never_again' | 'unrated';
export type VisitSource = 'transaction' | 'manual';

// Local types matching what components expect
export interface Visit {
  id: string;
  venueId: string | null;
  venueName: string;
  venueType: string | null;
  date: string;
  amount?: number;
  reaction?: Reaction;
  notes?: string;
  source: VisitSource;
}

export interface Place {
  venueId: string | null;
  venueName: string;
  venueType: string | null;
  visitCount: number;
  lastVisit: string;
  totalSpent: number;
  reaction?: Reaction;
  photoUrl?: string;
  visits: Visit[];
}

export interface VaultStats {
  totalPlaces: number;
  totalVisits: number;
  thisMonthSpent: number;
}

export interface AddVisitData {
  venueId?: string;
  venueName: string;
  venueType?: string;
  date: string;
  amount?: number;
  notes?: string;
  photoUrl?: string;
}

// Helper to convert API place to local format
function mapApiPlace(apiPlace: VaultPlace): Place {
  return {
    venueId: apiPlace.venue_id,
    venueName: apiPlace.venue_name,
    venueType: apiPlace.venue_type,
    visitCount: apiPlace.visit_count,
    lastVisit: apiPlace.last_visit,
    totalSpent: apiPlace.total_spent,
    reaction: apiPlace.reaction as Reaction | undefined,
    photoUrl: apiPlace.photo_url || undefined,
    visits: apiPlace.visits.map(mapApiVisit),
  };
}

function mapApiVisit(apiVisit: VaultVisit): Visit {
  return {
    id: apiVisit.id,
    venueId: apiVisit.venue_id,
    venueName: apiVisit.venue_name || 'Unknown',
    venueType: apiVisit.venue_type,
    date: apiVisit.visited_at,
    amount: apiVisit.amount || undefined,
    reaction: apiVisit.reaction as Reaction | undefined,
    notes: apiVisit.notes || undefined,
    source: apiVisit.source as VisitSource,
  };
}

// Filter helpers
function getPlacesByStatus(places: Place[], filter: StatusFilter): Place[] {
  switch (filter) {
    case 'loved':
      return places.filter((p) => p.reaction === 'loved');
    case 'good':
      return places.filter((p) => p.reaction === 'good');
    case 'meh':
      return places.filter((p) => p.reaction === 'meh');
    case 'never_again':
      return places.filter((p) => p.reaction === 'never_again');
    case 'unrated':
      return places.filter((p) => p.reaction === undefined);
    default:
      return places;
  }
}

interface VaultState {
  places: Place[];
  visits: Visit[];
  selectedPlace: Place | null;
  currentFilter: StatusFilter;
  filteredPlaces: Place[];
  stats: VaultStats;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Actions
  fetchVisits: (userId: string) => Promise<void>;
  setSelectedPlace: (placeId: string | null) => void;
  setFilter: (filter: StatusFilter) => void;
  updateReaction: (venueId: string, reaction: Reaction) => void;
  addNote: (visitId: string, note: string) => void;
  addVisit: (userId: string, data: AddVisitData) => void;
  rateVisit: (visitId: string, reaction: Reaction) => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  places: [],
  visits: [],
  selectedPlace: null,
  currentFilter: 'all',
  filteredPlaces: [],
  stats: { totalPlaces: 0, totalVisits: 0, thisMonthSpent: 0 },
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchVisits: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await vaultApi.getVisits(userId);

      const places = response.places.map(mapApiPlace);
      const visits = places.flatMap((p) => p.visits);
      const { currentFilter } = get();

      set({
        places,
        visits,
        filteredPlaces: getPlacesByStatus(places, currentFilter),
        stats: {
          totalPlaces: response.stats.total_places,
          totalVisits: response.stats.total_visits,
          thisMonthSpent: response.stats.this_month_spent,
        },
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      console.error('[Vault] Failed to fetch visits:', error);
      set({ isLoading: false, error: 'Failed to load visits', hasFetched: true });
    }
  },

  setSelectedPlace: (placeId) => {
    if (!placeId) {
      set({ selectedPlace: null });
      return;
    }
    const { places } = get();
    // Search by venueId first, then by venueName (for places without venueId)
    const place = places.find((p) => p.venueId === placeId || p.venueName === placeId);
    set({ selectedPlace: place || null });
  },

  setFilter: (filter) => {
    const { places } = get();
    const filtered = getPlacesByStatus(places, filter);
    set({ filteredPlaces: filtered, currentFilter: filter });
  },

  updateReaction: (placeId, reaction) => {
    // Helper to match place by venueId or venueName (for places without venueId)
    const matchesPlace = (place: Place) =>
      place.venueId === placeId || place.venueName === placeId;

    // Optimistic update - API call happens in rateVisit
    set((state) => ({
      places: state.places.map((place) =>
        matchesPlace(place) ? { ...place, reaction } : place
      ),
      filteredPlaces: state.filteredPlaces.map((place) =>
        matchesPlace(place) ? { ...place, reaction } : place
      ),
      selectedPlace:
        state.selectedPlace && matchesPlace(state.selectedPlace)
          ? { ...state.selectedPlace, reaction }
          : state.selectedPlace,
    }));
  },

  addNote: (visitId, note) => {
    // Update locally, API call can be added later
    set((state) => ({
      visits: state.visits.map((visit) =>
        visit.id === visitId ? { ...visit, notes: note } : visit
      ),
    }));

    // Call API in background
    vaultApi.updateVisit(visitId, { notes: note }).catch((error) => {
      console.error('[Vault] Failed to update note:', error);
    });
  },

  addVisit: (userId, data) => {
    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    const newVisit: Visit = {
      id: tempId,
      venueId: data.venueId || null,
      venueName: data.venueName,
      venueType: data.venueType || null,
      date: data.date,
      amount: data.amount,
      notes: data.notes,
      source: 'manual',
    };

    set((state) => {
      const existingPlace = state.places.find((p) =>
        p.venueId === data.venueId || p.venueName === data.venueName
      );
      let updatedPlaces: Place[];
      let updatedSelectedPlace = state.selectedPlace;

      if (existingPlace) {
        updatedPlaces = state.places.map((place) =>
          (place.venueId === data.venueId || place.venueName === data.venueName)
            ? {
                ...place,
                visitCount: place.visitCount + 1,
                lastVisit: data.date > place.lastVisit ? data.date : place.lastVisit,
                totalSpent: place.totalSpent + (data.amount || 0),
                visits: [newVisit, ...place.visits],
                photoUrl: data.photoUrl || place.photoUrl,
              }
            : place
        );

        // Update selectedPlace if the visit is for the currently selected place
        if (state.selectedPlace &&
            (state.selectedPlace.venueId === data.venueId ||
             state.selectedPlace.venueName === data.venueName)) {
          updatedSelectedPlace = {
            ...state.selectedPlace,
            visitCount: state.selectedPlace.visitCount + 1,
            lastVisit: data.date > state.selectedPlace.lastVisit ? data.date : state.selectedPlace.lastVisit,
            totalSpent: state.selectedPlace.totalSpent + (data.amount || 0),
            visits: [newVisit, ...state.selectedPlace.visits],
            photoUrl: data.photoUrl || state.selectedPlace.photoUrl,
          };
        }
      } else {
        const newPlace: Place = {
          venueId: data.venueId || null,
          venueName: data.venueName,
          venueType: data.venueType || null,
          visitCount: 1,
          lastVisit: data.date,
          totalSpent: data.amount || 0,
          reaction: undefined,
          photoUrl: data.photoUrl,
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
        selectedPlace: updatedSelectedPlace,
        stats: {
          ...state.stats,
          totalPlaces: updatedPlaces.length,
          totalVisits: state.visits.length + 1,
        },
      };
    });

    // Persist to backend
    vaultApi.createVisit(userId, {
      venue_id: data.venueId,
      merchant_name: data.venueName,
      visited_at: data.date,
      amount: data.amount,
      notes: data.notes,
    }).then((created) => {
      // Update temp ID with real ID from response
      set((state) => ({
        visits: state.visits.map((v) =>
          v.id === tempId ? { ...v, id: created.id } : v
        ),
        places: state.places.map((p) => ({
          ...p,
          visits: p.visits.map((v) =>
            v.id === tempId ? { ...v, id: created.id } : v
          ),
        })),
      }));
    }).catch((error) => {
      console.error('[Vault] Failed to create visit:', error);
    });
  },

  rateVisit: (visitId, reaction) => {
    set((state) => {
      const updatedVisits = state.visits.map((visit) =>
        visit.id === visitId ? { ...visit, reaction } : visit
      );

      const visit = state.visits.find((v) => v.id === visitId);
      if (!visit) return state;

      // Helper to match place by venueId or venueName
      const matchesVisit = (place: Place) =>
        (visit.venueId && place.venueId === visit.venueId) ||
        (!visit.venueId && place.venueName === visit.venueName);

      const updatedPlaces = state.places.map((place) => {
        if (!matchesVisit(place)) return place;

        const updatedPlaceVisits = place.visits.map((v) =>
          v.id === visitId ? { ...v, reaction } : v
        );

        return {
          ...place,
          visits: updatedPlaceVisits,
          reaction: place.reaction || reaction,
        };
      });

      const { currentFilter } = state;
      const filtered = getPlacesByStatus(updatedPlaces, currentFilter);

      const matchesSelectedPlace = state.selectedPlace && matchesVisit(state.selectedPlace);
      const selectedPlace = matchesSelectedPlace
        ? updatedPlaces.find(matchesVisit) || null
        : state.selectedPlace;

      return {
        visits: updatedVisits,
        places: updatedPlaces,
        filteredPlaces: filtered,
        selectedPlace,
      };
    });

    // Call API in background
    vaultApi.updateVisit(visitId, { reaction }).catch((error) => {
      console.error('[Vault] Failed to update reaction:', error);
    });
  },
}));
