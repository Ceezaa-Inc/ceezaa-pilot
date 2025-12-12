/**
 * Typography System - Ceezaa Design System
 * Manrope font family throughout
 */

import { Platform } from 'react-native';

// Font family configuration
export const fontFamily = {
  regular: Platform.select({
    ios: 'Manrope-Regular',
    android: 'Manrope-Regular',
    default: 'Manrope-Regular',
  }),
  medium: Platform.select({
    ios: 'Manrope-Medium',
    android: 'Manrope-Medium',
    default: 'Manrope-Medium',
  }),
  semibold: Platform.select({
    ios: 'Manrope-SemiBold',
    android: 'Manrope-SemiBold',
    default: 'Manrope-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Manrope-Bold',
    android: 'Manrope-Bold',
    default: 'Manrope-Bold',
  }),
  extrabold: Platform.select({
    ios: 'Manrope-ExtraBold',
    android: 'Manrope-ExtraBold',
    default: 'Manrope-ExtraBold',
  }),
} as const;

export const typography = {
  fontFamily,

  // Font sizes (in pixels) - Mobile scale
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line heights (multipliers)
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
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
} as const;

// Pre-defined text styles for mobile
export const textStyles = {
  // Headings
  h1: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.tight,
    fontFamily: fontFamily.semibold,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.snug,
    fontFamily: fontFamily.semibold,
  },

  // Body text
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    fontFamily: fontFamily.regular,
  },
  bodyLarge: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    fontFamily: fontFamily.regular,
  },
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.lineHeight.normal,
    fontFamily: fontFamily.regular,
  },

  // UI text
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    fontFamily: fontFamily.medium,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    fontFamily: fontFamily.medium,
  },
  overline: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wider,
    fontFamily: fontFamily.semibold,
  },
  button: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.none,
    fontFamily: fontFamily.semibold,
  },
} as const;
