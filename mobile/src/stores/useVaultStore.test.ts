import { act } from '@testing-library/react-native';
import { useVaultStore } from './useVaultStore';
import { PLACES, VISITS, VAULT_STATS } from '@/mocks/visits';

describe('useVaultStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useVaultStore.setState({
      places: PLACES,
      visits: VISITS,
      selectedPlace: null,
      currentFilter: 'all',
      filteredPlaces: PLACES,
      stats: VAULT_STATS,
    });
  });

  describe('initial state', () => {
    it('should have places loaded', () => {
      const state = useVaultStore.getState();
      expect(state.places.length).toBeGreaterThan(0);
    });

    it('should have visits loaded', () => {
      const state = useVaultStore.getState();
      expect(state.visits.length).toBeGreaterThan(0);
    });

    it('should have no selected place initially', () => {
      const state = useVaultStore.getState();
      expect(state.selectedPlace).toBeNull();
    });

    it('should show all places as filtered initially', () => {
      const state = useVaultStore.getState();
      expect(state.filteredPlaces).toEqual(PLACES);
      expect(state.currentFilter).toBe('all');
    });

    it('should have vault stats', () => {
      const state = useVaultStore.getState();
      expect(state.stats).toBeDefined();
      expect(state.stats.totalPlaces).toBeGreaterThan(0);
    });
  });

  describe('setSelectedPlace', () => {
    it('should set selected place by venue ID', () => {
      const venueId = PLACES[0].venueId;
      act(() => {
        useVaultStore.getState().setSelectedPlace(venueId);
      });
      const state = useVaultStore.getState();
      expect(state.selectedPlace).not.toBeNull();
      expect(state.selectedPlace?.venueId).toBe(venueId);
    });

    it('should clear selected place when null is passed', () => {
      act(() => {
        useVaultStore.getState().setSelectedPlace(PLACES[0].venueId);
      });
      expect(useVaultStore.getState().selectedPlace).not.toBeNull();

      act(() => {
        useVaultStore.getState().setSelectedPlace(null);
      });
      expect(useVaultStore.getState().selectedPlace).toBeNull();
    });
  });

  describe('setFilter', () => {
    it('should filter by visited status (places with reactions)', () => {
      act(() => {
        useVaultStore.getState().setFilter('visited');
      });
      const state = useVaultStore.getState();
      expect(state.currentFilter).toBe('visited');
      state.filteredPlaces.forEach((place) => {
        expect(place.reaction).toBeDefined();
      });
    });

    it('should filter by review status (places needing review)', () => {
      act(() => {
        useVaultStore.getState().setFilter('review');
      });
      const state = useVaultStore.getState();
      expect(state.currentFilter).toBe('review');
      // Review filter shows places without reaction or with unrated visits
      state.filteredPlaces.forEach((place) => {
        const needsReview = !place.reaction || place.visits.some((v) => !v.reaction);
        expect(needsReview).toBe(true);
      });
    });

    it('should show all places when filter is all', () => {
      // First filter
      act(() => {
        useVaultStore.getState().setFilter('visited');
      });

      // Then show all
      act(() => {
        useVaultStore.getState().setFilter('all');
      });
      const state = useVaultStore.getState();
      expect(state.filteredPlaces).toEqual(state.places);
      expect(state.currentFilter).toBe('all');
    });
  });

  describe('updateReaction', () => {
    it('should update reaction for a place', () => {
      const venueId = PLACES[0].venueId;
      const originalReaction = PLACES[0].reaction;

      act(() => {
        useVaultStore.getState().updateReaction(venueId, 'loved');
      });

      const state = useVaultStore.getState();
      const updatedPlace = state.places.find((p) => p.venueId === venueId);
      expect(updatedPlace?.reaction).toBe('loved');
    });

    it('should update selected place reaction if it matches', () => {
      const venueId = PLACES[0].venueId;

      act(() => {
        useVaultStore.getState().setSelectedPlace(venueId);
      });

      act(() => {
        useVaultStore.getState().updateReaction(venueId, 'meh');
      });

      expect(useVaultStore.getState().selectedPlace?.reaction).toBe('meh');
    });
  });

  describe('addNote', () => {
    it('should add note to a visit', () => {
      const visitId = VISITS[0].id;
      const newNote = 'Great experience!';

      act(() => {
        useVaultStore.getState().addNote(visitId, newNote);
      });

      const state = useVaultStore.getState();
      const updatedVisit = state.visits.find((v) => v.id === visitId);
      expect(updatedVisit?.notes).toBe(newNote);
    });
  });
});
