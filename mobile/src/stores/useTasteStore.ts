import { create } from 'zustand';
import {
  TasteProfile,
  TasteTrait,
  TasteCategory,
  Insight,
  TASTE_PROFILE,
  TASTE_TRAITS,
  TASTE_CATEGORIES,
  INSIGHTS,
  MOOD_DATA,
  MoodType,
} from '@/mocks/taste';
import { tasteApi, TasteProfile as ApiTasteProfile, TasteTrait as ApiTasteTrait } from '@/services/api';

interface TasteState {
  profile: TasteProfile;
  traits: TasteTrait[];
  categories: TasteCategory[];
  insights: Insight[];
  selectedMood: MoodType | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;

  // Actions
  setSelectedMood: (mood: MoodType | null) => void;
  getMoodGradient: (mood: MoodType) => string[];
  getMoodData: (mood: MoodType) => (typeof MOOD_DATA)[MoodType];
  refreshProfile: () => void;
  fetchProfile: (userId: string) => Promise<void>;
  clearError: () => void;
}

// Convert API trait to mock TasteTrait format
function convertApiTrait(apiTrait: ApiTasteTrait): TasteTrait {
  return {
    name: apiTrait.name,
    emoji: apiTrait.emoji,
    description: apiTrait.description,
    score: apiTrait.score,
    color: apiTrait.color,
  };
}

// Convert API profile to mock TasteProfile format
function convertApiProfile(apiProfile: ApiTasteProfile): TasteProfile {
  return {
    score: 0, // Will be calculated from traits
    traits: [],
    categories: TASTE_CATEGORIES,
    insights: INSIGHTS,
    topCuisines: apiProfile.cuisine_preferences || [],
    diningStyle: apiProfile.title,
    title: apiProfile.title,
    tagline: apiProfile.tagline,
    pricePreference: apiProfile.price_tier || 'moderate',
    explorationRatio: 0.5,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
  };
}

export const useTasteStore = create<TasteState>((set, get) => ({
  profile: TASTE_PROFILE,
  traits: TASTE_TRAITS,
  categories: TASTE_CATEGORIES,
  insights: INSIGHTS,
  selectedMood: null,
  isLoading: false,
  error: null,
  hasFetched: false,

  setSelectedMood: (mood) => {
    set({ selectedMood: mood });
  },

  getMoodGradient: (mood) => {
    return MOOD_DATA[mood]?.gradient || MOOD_DATA.chill.gradient;
  },

  getMoodData: (mood) => {
    return MOOD_DATA[mood];
  },

  refreshProfile: () => {
    // Reset to mock data
    set({
      profile: TASTE_PROFILE,
      traits: TASTE_TRAITS,
      categories: TASTE_CATEGORIES,
      insights: INSIGHTS,
    });
  },

  fetchProfile: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[TasteStore] Fetching profile for user:', userId);
      const apiProfile = await tasteApi.getProfile(userId);
      console.log('[TasteStore] Profile fetched:', apiProfile.title);

      set({
        profile: convertApiProfile(apiProfile),
        traits: apiProfile.traits.map(convertApiTrait),
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      console.error('[TasteStore] Fetch error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';

      // On error, keep mock data but set error state
      set({
        isLoading: false,
        error: message,
        hasFetched: true,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
