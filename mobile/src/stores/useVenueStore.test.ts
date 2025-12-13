import { act } from '@testing-library/react-native';
import { useVenueStore } from './useVenueStore';
import { VENUES } from '@/mocks/venues';

describe('useVenueStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useVenueStore.setState({
      venues: VENUES,
      selectedVenue: null,
      filteredVenues: VENUES,
      currentMood: null,
      isLoading: false,
    });
  });

  describe('initial state', () => {
    it('should have all venues loaded', () => {
      const state = useVenueStore.getState();
      expect(state.venues).toHaveLength(20);
    });

    it('should have no selected venue initially', () => {
      const state = useVenueStore.getState();
      expect(state.selectedVenue).toBeNull();
    });

    it('should show all venues as filtered initially', () => {
      const state = useVenueStore.getState();
      expect(state.filteredVenues).toEqual(state.venues);
    });

    it('should have no current mood initially', () => {
      const state = useVenueStore.getState();
      expect(state.currentMood).toBeNull();
    });
  });

  describe('setSelectedVenue', () => {
    it('should set selected venue by ID', () => {
      act(() => {
        useVenueStore.getState().setSelectedVenue('1');
      });
      const state = useVenueStore.getState();
      expect(state.selectedVenue).not.toBeNull();
      expect(state.selectedVenue?.name).toBe('Bella Italia');
    });

    it('should clear selected venue when null is passed', () => {
      act(() => {
        useVenueStore.getState().setSelectedVenue('1');
      });
      expect(useVenueStore.getState().selectedVenue).not.toBeNull();

      act(() => {
        useVenueStore.getState().setSelectedVenue(null);
      });
      expect(useVenueStore.getState().selectedVenue).toBeNull();
    });

    it('should set null for non-existent venue ID', () => {
      act(() => {
        useVenueStore.getState().setSelectedVenue('non-existent');
      });
      expect(useVenueStore.getState().selectedVenue).toBeNull();
    });
  });

  describe('filterByMood', () => {
    it('should filter venues by romantic mood', () => {
      act(() => {
        useVenueStore.getState().filterByMood('romantic');
      });
      const state = useVenueStore.getState();
      expect(state.currentMood).toBe('romantic');
      expect(state.filteredVenues.length).toBeGreaterThan(0);
      state.filteredVenues.forEach((venue) => {
        expect(venue.moods).toContain('romantic');
      });
    });

    it('should filter venues by social mood', () => {
      act(() => {
        useVenueStore.getState().filterByMood('social');
      });
      const state = useVenueStore.getState();
      expect(state.currentMood).toBe('social');
      state.filteredVenues.forEach((venue) => {
        expect(venue.moods).toContain('social');
      });
    });
  });

  describe('clearFilter', () => {
    it('should clear filter and show all venues', () => {
      // First filter
      act(() => {
        useVenueStore.getState().filterByMood('romantic');
      });
      expect(useVenueStore.getState().filteredVenues.length).toBeLessThan(VENUES.length);

      // Then clear
      act(() => {
        useVenueStore.getState().clearFilter();
      });
      const state = useVenueStore.getState();
      expect(state.filteredVenues).toEqual(VENUES);
      expect(state.currentMood).toBeNull();
    });
  });

  describe('getTopMatches', () => {
    it('should return top 5 matches by default', () => {
      const topMatches = useVenueStore.getState().getTopMatches();
      expect(topMatches).toHaveLength(5);
    });

    it('should return top matches sorted by matchPercentage', () => {
      const topMatches = useVenueStore.getState().getTopMatches(3);
      expect(topMatches).toHaveLength(3);
      // Check descending order
      for (let i = 0; i < topMatches.length - 1; i++) {
        expect(topMatches[i].matchPercentage).toBeGreaterThanOrEqual(topMatches[i + 1].matchPercentage);
      }
    });

    it('should return custom limit of matches', () => {
      const topMatches = useVenueStore.getState().getTopMatches(10);
      expect(topMatches).toHaveLength(10);
    });
  });
});
