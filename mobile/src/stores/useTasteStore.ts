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
import { tasteApi, TasteProfile as ApiTasteProfile, TasteTrait as ApiTasteTrait, FusedTasteProfile, InsightsResponse, DNAResponse } from '@/services/api';

interface TasteState {
  profile: TasteProfile;
  traits: TasteTrait[];
  categories: TasteCategory[];
  insights: Insight[];
  selectedMood: MoodType | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  hasFetchedInsights: boolean;
  hasFetchedDNA: boolean;

  // Actions
  setSelectedMood: (mood: MoodType | null) => void;
  getMoodGradient: (mood: MoodType) => string[];
  getMoodData: (mood: MoodType) => (typeof MOOD_DATA)[MoodType];
  refreshProfile: () => void;
  fetchProfile: (userId: string) => Promise<void>;
  fetchFusedProfile: (userId: string) => Promise<void>;
  fetchInsights: (userId: string) => Promise<void>;
  clearInsightsCache: (userId: string) => Promise<void>;
  fetchDNA: (userId: string) => Promise<void>;
  clearDNACache: (userId: string) => Promise<void>;
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
  hasFetchedInsights: false,
  hasFetchedDNA: false,

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

  fetchFusedProfile: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[TasteStore] Fetching fused profile for user:', userId);
      const fusedProfile = await tasteApi.getFused(userId);
      console.log('[TasteStore] Fused profile fetched:', fusedProfile.profile_title);

      // Convert fused categories to TasteCategory format
      const fusedCategories: TasteCategory[] = fusedProfile.categories.map((cat) => ({
        name: cat.name,
        score: cat.percentage,
        color: cat.color,
      }));

      // Update profile with fused data
      const currentProfile = get().profile;
      set({
        profile: {
          ...currentProfile,
          title: fusedProfile.profile_title,
          tagline: fusedProfile.profile_tagline,
          explorationRatio: fusedProfile.exploration_ratio,
        },
        categories: fusedCategories.length > 0 ? fusedCategories : TASTE_CATEGORIES,
        isLoading: false,
        hasFetched: true,
      });

      console.log('[TasteStore] Categories updated:', fusedCategories.length);
    } catch (error) {
      console.error('[TasteStore] Fused fetch error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch fused profile';

      // On error, keep existing data but set error state
      set({
        isLoading: false,
        error: message,
        hasFetched: true,
      });
    }
  },

  fetchInsights: async (userId: string) => {
    try {
      console.log('[TasteStore] Fetching insights for user:', userId);
      const response = await tasteApi.getInsights(userId);
      console.log('[TasteStore] Insights fetched:', response.insights.length);

      // Convert API insights to local Insight format
      const insights: Insight[] = response.insights.map((apiInsight) => ({
        id: apiInsight.id,
        emoji: apiInsight.emoji,
        title: apiInsight.title,
        description: apiInsight.body, // API uses "body", local uses "description"
        type: apiInsight.type as Insight['type'],
      }));

      set({
        insights: insights.length > 0 ? insights : INSIGHTS,
        hasFetchedInsights: true,
      });
    } catch (error) {
      console.error('[TasteStore] Insights fetch error:', error);
      // On error, keep mock data but allow retry (don't set hasFetchedInsights)
    }
  },

  clearInsightsCache: async (userId: string) => {
    try {
      console.log('[TasteStore] Clearing insights cache for:', userId);
      await tasteApi.clearInsightsCache(userId);
      set({ hasFetchedInsights: false, insights: INSIGHTS });
      console.log('[TasteStore] Cache cleared, ready for refetch');
    } catch (error) {
      console.error('[TasteStore] Clear cache error:', error);
    }
  },

  fetchDNA: async (userId: string) => {
    try {
      console.log('[TasteStore] Fetching DNA for user:', userId);
      const response = await tasteApi.getDNA(userId);
      console.log('[TasteStore] DNA fetched:', response.traits.length, 'traits');

      // Convert API DNA traits to local TasteTrait format
      const traits: TasteTrait[] = response.traits.map((apiTrait) => ({
        name: apiTrait.name,
        emoji: apiTrait.emoji,
        description: apiTrait.description,
        score: 0, // DNA traits don't have scores
        color: apiTrait.color,
      }));

      set({
        traits: traits.length > 0 ? traits : TASTE_TRAITS,
        hasFetchedDNA: true,
      });
    } catch (error) {
      console.error('[TasteStore] DNA fetch error:', error);
      // On error, keep mock data but allow retry
    }
  },

  clearDNACache: async (userId: string) => {
    try {
      console.log('[TasteStore] Clearing DNA cache for:', userId);
      await tasteApi.clearDNACache(userId);
      set({ hasFetchedDNA: false, traits: TASTE_TRAITS });
      console.log('[TasteStore] DNA cache cleared, ready for refetch');
    } catch (error) {
      console.error('[TasteStore] Clear DNA cache error:', error);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
