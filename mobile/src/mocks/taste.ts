export interface TasteTrait {
  name: string;
  emoji: string;
  description: string;
  score: number;
  color: string;
}

export interface TasteCategory {
  name: string;
  score: number;
  color: string;
  icon: string;
}

export interface Insight {
  id: string;
  emoji: string;
  title: string;
  description: string;
  type: 'discovery' | 'pattern' | 'suggestion';
}

export interface TasteProfile {
  score: number;
  traits: TasteTrait[];
  categories: TasteCategory[];
  insights: Insight[];
  topCuisines: string[];
  diningStyle: string;
  title: string;
  tagline: string;
  pricePreference: string;
  explorationRatio: number;
  level?: number;
  xp?: number;
  nextLevelXp?: number;
}

export const TASTE_TRAITS: TasteTrait[] = [
  { name: 'Adventurous', emoji: '🌍', description: 'You love trying new cuisines', score: 85, color: '#14B8A6' },
  { name: 'Social', emoji: '👥', description: 'Dining is a group activity', score: 72, color: '#0EA5E9' },
  { name: 'Refined', emoji: '✨', description: 'Quality over quantity', score: 91, color: '#D3B481' },
  { name: 'Cozy', emoji: '🏠', description: 'Comfort food lover', score: 58, color: '#F59E0B' },
];

export const TASTE_CATEGORIES: TasteCategory[] = [
  { name: 'Italian', score: 85, color: '#E74C3C', icon: '🍝' },
  { name: 'Japanese', score: 72, color: '#3498DB', icon: '🍣' },
  { name: 'American', score: 58, color: '#F39C12', icon: '🍔' },
  { name: 'Mexican', score: 45, color: '#2ECC71', icon: '🌮' },
  { name: 'Other', score: 30, color: '#9B59B6', icon: '🍽️' },
];

export const INSIGHTS: Insight[] = [
  {
    id: 'i1',
    emoji: '🌟',
    title: 'New Discovery',
    description: 'Try Japanese izakayas - 89% match',
    type: 'discovery',
  },
  {
    id: 'i2',
    emoji: '📈',
    title: 'Trending Up',
    description: 'Your Italian visits increased 20%',
    type: 'pattern',
  },
  {
    id: 'i3',
    emoji: '🎯',
    title: 'Perfect Match',
    description: 'Le Petit Bistro matches your refined taste',
    type: 'suggestion',
  },
  {
    id: 'i4',
    emoji: '🔥',
    title: 'Hot Streak',
    description: "You've visited 5 new places this month!",
    type: 'pattern',
  },
  {
    id: 'i5',
    emoji: '💡',
    title: 'Weekend Warrior',
    description: '80% of your dining is on weekends',
    type: 'pattern',
  },
];

export const TASTE_PROFILE: TasteProfile = {
  score: 91,
  traits: TASTE_TRAITS,
  categories: TASTE_CATEGORIES,
  insights: INSIGHTS,
  topCuisines: ['Italian', 'Japanese', 'American'],
  diningStyle: 'Experience Seeker',
  title: 'Experience Seeker',
  tagline: 'Always chasing the next great bite',
  pricePreference: 'Mid to High',
  explorationRatio: 0.65, // 65% new places vs favorites
};

export const MOOD_DATA = {
  chill: {
    label: 'Chill',
    description: 'Relaxed vibes, no rush',
    gradient: ['#6366F1', '#4338CA'],
  },
  energetic: {
    label: 'Energetic',
    description: 'Lively atmosphere, music',
    gradient: ['#F97316', '#DC2626'],
  },
  romantic: {
    label: 'Romantic',
    description: 'Intimate, special occasion',
    gradient: ['#EC4899', '#BE185D'],
  },
  social: {
    label: 'Social',
    description: 'Group friendly, shareable',
    gradient: ['#0EA5E9', '#0284C7'],
  },
  adventurous: {
    label: 'Adventurous',
    description: 'Try something new',
    gradient: ['#14B8A6', '#0D9488'],
  },
  cozy: {
    label: 'Cozy',
    description: 'Comfort food, warm feels',
    gradient: ['#F59E0B', '#D97706'],
  },
};

export type MoodType = keyof typeof MOOD_DATA;

export const getMoodGradient = (mood: MoodType): string[] => {
  return MOOD_DATA[mood]?.gradient || MOOD_DATA.chill.gradient;
};
