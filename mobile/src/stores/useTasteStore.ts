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

interface TasteState {
  profile: TasteProfile;
  traits: TasteTrait[];
  categories: TasteCategory[];
  insights: Insight[];
  selectedMood: MoodType | null;

  // Actions
  setSelectedMood: (mood: MoodType | null) => void;
  getMoodGradient: (mood: MoodType) => string[];
  getMoodData: (mood: MoodType) => (typeof MOOD_DATA)[MoodType];
  refreshProfile: () => void;
}

export const useTasteStore = create<TasteState>((set, get) => ({
  profile: TASTE_PROFILE,
  traits: TASTE_TRAITS,
  categories: TASTE_CATEGORIES,
  insights: INSIGHTS,
  selectedMood: null,

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
    // In real app, this would fetch from API
    set({
      profile: TASTE_PROFILE,
      traits: TASTE_TRAITS,
      categories: TASTE_CATEGORIES,
      insights: INSIGHTS,
    });
  },
}));
