/**
 * Spacing System - Generous whitespace for clean, breathable layouts
 * Based on 4px grid system
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
} as const

// Semantic spacing aliases
export const layoutSpacing = {
  // Screen padding
  screenHorizontal: spacing[5], // 20px - standard screen padding
  screenVertical: spacing[6],   // 24px

  // Section spacing
  sectionGap: spacing[8],       // 32px between major sections
  contentGap: spacing[4],       // 16px between content blocks

  // Component spacing
  cardPadding: spacing[4],      // 16px inside cards
  inputPadding: spacing[4],     // 16px inside inputs
  buttonPaddingY: spacing[4],   // 16px vertical button padding
  buttonPaddingX: spacing[8],   // 32px horizontal button padding

  // List spacing
  listItemGap: spacing[3],      // 12px between list items
  listItemPadding: spacing[4],  // 16px inside list items
} as const

export type SpacingToken = keyof typeof spacing
