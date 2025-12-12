/**
 * Spacing System - Ceezaa Design System
 * 4px base unit for consistent rhythm
 */

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
} as const;

// Semantic spacing aliases
export const layoutSpacing = {
  // Named sizes
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[4], // 16px
  lg: spacing[6], // 24px
  xl: spacing[8], // 32px
  '2xl': spacing[12], // 48px
  '3xl': spacing[16], // 64px

  // Screen padding
  screenHorizontal: spacing[5], // 20px
  screenVertical: spacing[6], // 24px

  // Section spacing
  sectionGap: spacing[8], // 32px between major sections
  contentGap: spacing[4], // 16px between content blocks

  // Component spacing
  cardPadding: spacing[4], // 16px inside cards
  inputPadding: spacing[4], // 16px inside inputs
  buttonPaddingY: spacing[3], // 12px vertical button padding
  buttonPaddingX: spacing[8], // 32px horizontal button padding

  // List spacing
  listItemGap: spacing[3], // 12px between list items
  listItemPadding: spacing[4], // 16px inside list items
} as const;

export type SpacingToken = keyof typeof spacing;
