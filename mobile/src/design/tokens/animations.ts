/**
 * Animation System - Ceezaa Design System
 * For use with react-native-reanimated and moti
 */

import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

export const easing = {
  // Standard easings
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Smooth spring-like
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),

  // Bouncy for playful interactions
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),

  // Sharp for quick feedback
  sharp: Easing.bezier(0.4, 0, 0.2, 1),
} as const;

// Spring configurations for react-native-reanimated
export const spring = {
  // Gentle spring for most UI
  gentle: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },

  // Snappy for buttons, quick feedback
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  },

  // Bouncy for fun interactions
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 1,
  },

  // Slow for dramatic reveals
  slow: {
    damping: 25,
    stiffness: 120,
    mass: 1.2,
  },
} as const;

// Pre-defined animation presets for moti
export const animationPresets = {
  // Fade in
  fadeIn: {
    from: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: duration.normal },
  },

  // Fade out
  fadeOut: {
    from: { opacity: 1 },
    animate: { opacity: 0 },
    transition: { duration: duration.normal },
  },

  // Slide up (for modals, cards)
  slideUp: {
    from: { opacity: 0, translateY: 20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { type: 'spring', ...spring.gentle },
  },

  // Slide down
  slideDown: {
    from: { opacity: 0, translateY: -20 },
    animate: { opacity: 1, translateY: 0 },
    transition: { type: 'spring', ...spring.gentle },
  },

  // Scale in (for buttons, icons)
  scaleIn: {
    from: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: 'spring', ...spring.snappy },
  },

  // Press feedback
  pressIn: {
    scale: 0.97,
    opacity: 0.9,
  },
  pressOut: {
    scale: 1,
    opacity: 1,
  },
} as const;

export type DurationToken = keyof typeof duration;
