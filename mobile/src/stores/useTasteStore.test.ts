import { act } from '@testing-library/react-native';
import { useTasteStore } from './useTasteStore';
import { TASTE_PROFILE, TASTE_TRAITS, TASTE_CATEGORIES, INSIGHTS, MOOD_DATA } from '@/mocks/taste';

describe('useTasteStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useTasteStore.setState({
      profile: TASTE_PROFILE,
      traits: TASTE_TRAITS,
      categories: TASTE_CATEGORIES,
      insights: INSIGHTS,
      selectedMood: null,
    });
  });

  describe('initial state', () => {
    it('should have correct initial profile', () => {
      const state = useTasteStore.getState();
      expect(state.profile).toEqual(TASTE_PROFILE);
      expect(state.profile.score).toBe(91);
    });

    it('should have taste traits', () => {
      const state = useTasteStore.getState();
      expect(state.traits).toHaveLength(4);
      expect(state.traits[0].name).toBe('Adventurous');
    });

    it('should have taste categories', () => {
      const state = useTasteStore.getState();
      expect(state.categories).toHaveLength(5);
      expect(state.categories[0].name).toBe('Italian');
    });

    it('should have insights', () => {
      const state = useTasteStore.getState();
      expect(state.insights.length).toBeGreaterThan(0);
      expect(state.insights[0]).toHaveProperty('emoji');
      expect(state.insights[0]).toHaveProperty('description');
    });

    it('should have no selected mood initially', () => {
      const state = useTasteStore.getState();
      expect(state.selectedMood).toBeNull();
    });
  });

  describe('setSelectedMood', () => {
    it('should set selected mood', () => {
      act(() => {
        useTasteStore.getState().setSelectedMood('romantic');
      });
      expect(useTasteStore.getState().selectedMood).toBe('romantic');
    });

    it('should clear selected mood when null is passed', () => {
      act(() => {
        useTasteStore.getState().setSelectedMood('social');
      });
      expect(useTasteStore.getState().selectedMood).toBe('social');

      act(() => {
        useTasteStore.getState().setSelectedMood(null);
      });
      expect(useTasteStore.getState().selectedMood).toBeNull();
    });
  });

  describe('getMoodGradient', () => {
    it('should return correct gradient for valid mood', () => {
      const gradient = useTasteStore.getState().getMoodGradient('romantic');
      expect(gradient).toEqual(MOOD_DATA.romantic.gradient);
    });

    it('should return chill gradient for invalid mood', () => {
      const gradient = useTasteStore.getState().getMoodGradient('invalid' as any);
      expect(gradient).toEqual(MOOD_DATA.chill.gradient);
    });
  });

  describe('getMoodData', () => {
    it('should return correct mood data', () => {
      const moodData = useTasteStore.getState().getMoodData('energetic');
      expect(moodData.label).toBe('Energetic');
      expect(moodData.description).toBe('Lively atmosphere, music');
    });
  });

  describe('refreshProfile', () => {
    it('should refresh profile data', () => {
      // Modify state first
      act(() => {
        useTasteStore.setState({ profile: { ...TASTE_PROFILE, score: 50 } });
      });
      expect(useTasteStore.getState().profile.score).toBe(50);

      // Refresh should restore original data
      act(() => {
        useTasteStore.getState().refreshProfile();
      });
      expect(useTasteStore.getState().profile.score).toBe(91);
    });
  });
});
