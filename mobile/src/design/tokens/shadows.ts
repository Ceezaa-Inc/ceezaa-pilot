/**
 * Shadow System - Ceezaa Design System
 * Subtle, elegant elevation for dark theme
 */

import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

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
});

export const shadows = {
  none: createShadow(0, 0, 0, 0),

  // Subtle shadow for slight lift
  sm: createShadow(1, 2, 0.3, 1),

  // Default card shadow
  DEFAULT: createShadow(4, 6, 0.4, 2),
  md: createShadow(4, 6, 0.4, 2),

  // Elevated cards, modals
  lg: createShadow(10, 15, 0.5, 4),

  // High elevation (floating buttons, etc)
  xl: createShadow(16, 24, 0.5, 8),

  // Gold glow for primary buttons
  glow: {
    shadowColor: '#D3B481',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 8 : 0,
  } as ShadowStyle,
} as const;

// Semantic shadow aliases
export const componentShadows = {
  card: shadows.md, // Standard card elevation
  cardHover: shadows.lg, // Card on press
  button: shadows.sm, // Subtle button shadow
  buttonPrimary: shadows.glow, // Gold glow for primary
  modal: shadows.xl, // Modal/bottom sheet
  dropdown: shadows.lg, // Dropdown menus
  fab: shadows.lg, // Floating action button
} as const;

export type ShadowToken = keyof typeof shadows;
