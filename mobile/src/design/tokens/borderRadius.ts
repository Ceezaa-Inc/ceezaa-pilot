/**
 * Border Radius System - Ceezaa Design System
 * Rounded corners for a soft, friendly feel
 */

export const borderRadius = {
  none: 0,
  sm: 8,
  DEFAULT: 12,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999, // Pill shape for buttons
} as const;

// Semantic radius aliases
export const componentRadius = {
  button: borderRadius.full, // Pill-shaped buttons
  buttonSmall: borderRadius.lg, // Smaller rounded buttons
  card: borderRadius.lg, // Cards with generous rounding
  input: borderRadius.sm, // Inputs with soft corners
  modal: borderRadius['2xl'], // Modal/sheet corners
  avatar: borderRadius.full, // Circular avatars
  chip: borderRadius.full, // Pill-shaped chips/tags
  image: borderRadius.md, // Image corners
  moodTile: borderRadius.lg, // Mood tile corners
} as const;

export type BorderRadiusToken = keyof typeof borderRadius;
