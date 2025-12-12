/**
 * Color Palette - Inspired by Believe app aesthetic
 * Minimal, clean, with vibrant green accent
 */

export const colors = {
  // Primary - Vibrant green (Believe-style)
  primary: {
    DEFAULT: '#00D26A',
    dark: '#00B85C',
    light: '#4ADE80',
  },

  // Backgrounds
  background: {
    DEFAULT: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
  },

  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Borders
  border: {
    DEFAULT: '#E5E7EB',
    light: '#F3F4F6',
    dark: '#D1D5DB',
  },

  // Semantic
  success: '#00D26A',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Utility
  transparent: 'transparent',
  black: '#000000',
  white: '#FFFFFF',
} as const

export type ColorToken = keyof typeof colors
