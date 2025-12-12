/**
 * Typography System - Clean, bold headings with readable body text
 * Inspired by Believe app's minimal typography
 */

import { Platform } from 'react-native'

// System font stack for each platform
const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  android: {
    regular: 'Roboto',
    medium: 'Roboto-Medium',
    semibold: 'Roboto-Medium',
    bold: 'Roboto-Bold',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
})

export const typography = {
  fontFamily,

  // Font sizes (in pixels)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (multipliers)
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
  },
} as const

// Pre-defined text styles (matching Believe aesthetic)
export const textStyles = {
  // Headings - Bold, tight letter spacing
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
  },

  // Body text
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },

  // UI text
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.none,
  },
} as const
