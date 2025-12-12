/**
 * Color Palette - Ceezaa Design System
 * Dark-first theme with Gold + Navy accents (like Spotify/Booking.com)
 */

export const colors = {
  // Brand Colors (used as accents)
  white: '#FFFFFF',
  navy: '#0A1A2F',
  gold: '#D3B481',

  // Dark Theme - Black background with brand accents
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceAlt: '#1A1A1A',
    surfaceMuted: '#242424',
    border: '#2A2A2A',
    borderMuted: '#1E1E1E',
    navyAccent: '#0A1A2F',
    navyAccentLight: '#132138',
  },

  // Primary (Gold)
  primary: {
    DEFAULT: '#D3B481',
    hover: '#C4A572',
    active: '#B59663',
    muted: '#2A2418',
  },

  // Grayscale (Official Brand)
  grayscale: {
    cloud: '#EDEFF7',
    smoke: '#D3D6E0',
    steel: '#BCBFCC',
    space: '#9DA2B3',
    graphite: '#6E7180',
    arsenic: '#40424D',
    phantom: '#1E1E24',
    black: '#000000',
  },

  // Text Colors
  text: {
    primary: '#FFFFFF',
    secondary: '#9DA2B3',
    muted: '#6E7180',
    disabled: '#40424D',
  },

  // Semantic Colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Trust Mode (Light theme for card linking ONLY)
  trust: {
    background: '#FFFFFF',
    surface: '#EDEFF7',
    text: '#0A1A2F',
    textSecondary: '#40424D',
    border: '#D3D6E0',
    primary: '#D3B481',
  },

  // Mood Gradients for Discover tiles
  mood: {
    chill: {
      start: '#6366F1',
      end: '#4338CA',
    },
    energetic: {
      start: '#F97316',
      end: '#DC2626',
    },
    romantic: {
      start: '#EC4899',
      end: '#BE185D',
    },
    social: {
      start: '#0EA5E9',
      end: '#0284C7',
    },
    adventurous: {
      start: '#14B8A6',
      end: '#0D9488',
    },
    cozy: {
      start: '#F59E0B',
      end: '#D97706',
    },
  },

  // Utility
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
