/**
 * Shadow System - Subtle, elegant elevation
 * Believe app uses very soft shadows for depth without heaviness
 */

import { Platform, ViewStyle } from 'react-native'

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>

// Cross-platform shadow helper
const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number
): ShadowStyle => ({
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: radius,
  elevation: Platform.OS === 'android' ? elevation : 0,
})

export const shadows = {
  none: createShadow(0, 0, 0, 0),

  // Subtle shadow for slight lift
  sm: createShadow(1, 2, 0.05, 1),

  // Default card shadow
  DEFAULT: createShadow(2, 4, 0.08, 2),
  md: createShadow(2, 4, 0.08, 2),

  // Elevated cards, modals
  lg: createShadow(4, 8, 0.1, 4),

  // High elevation (floating buttons, etc)
  xl: createShadow(8, 16, 0.12, 8),

  // Maximum elevation
  '2xl': createShadow(12, 24, 0.15, 12),
} as const

// Semantic shadow aliases
export const componentShadows = {
  card: shadows.md,           // Standard card elevation
  cardHover: shadows.lg,      // Card on press/hover
  button: shadows.sm,         // Subtle button shadow
  modal: shadows.xl,          // Modal/bottom sheet
  dropdown: shadows.lg,       // Dropdown menus
  fab: shadows.lg,            // Floating action button
} as const

export type ShadowToken = keyof typeof shadows
