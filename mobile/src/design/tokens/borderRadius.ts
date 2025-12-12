/**
 * Border Radius System - Rounded corners everywhere
 * Believe app uses generous rounding for a soft, friendly feel
 */

export const borderRadius = {
  none: 0,
  sm: 8,
  DEFAULT: 12,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999, // Pill shape for buttons
} as const

// Semantic radius aliases
export const componentRadius = {
  button: borderRadius.full,      // Pill-shaped buttons (Believe style)
  buttonSmall: borderRadius.lg,   // Smaller rounded buttons
  card: borderRadius['2xl'],      // Cards with generous rounding
  input: borderRadius.xl,         // Inputs with soft corners
  modal: borderRadius['2xl'],     // Modal/sheet corners
  avatar: borderRadius.full,      // Circular avatars
  chip: borderRadius.full,        // Pill-shaped chips/tags
  image: borderRadius.lg,         // Image corners
} as const

export type BorderRadiusToken = keyof typeof borderRadius
