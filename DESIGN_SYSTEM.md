# Ceezaa Design System

> **Philosophy:** Warm, intelligent social discovery with luxurious depth
> **Brand Colors:** Navy + Gold + White

---

## Table of Contents
1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing](#4-spacing)
5. [Border Radius](#5-border-radius)
6. [Shadows & Elevation](#6-shadows--elevation)
7. [Animation](#7-animation)
8. [Components](#8-components)
9. [Screen Theme Mapping](#9-screen-theme-mapping)
10. [Implementation Guide](#10-implementation-guide)

---

## 1. Design Philosophy

### Brand Voice
- **Warm & Inclusive:** Inviting, approachable, welcoming
- **Intelligent & Thoughtful:** Insightful, culturally aware
- **Modern & Artful:** Fresh, vibrant, trend-conscious
- **Authentic & Real:** Sincere, genuine connection
- **Curious & Explorative:** Discovery-driven
- **Playful & Fun:** Joy in shared experiences

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Navy-First** | Deep navy backgrounds convey premium sophistication |
| **Golden Warmth** | Gold accents provide warmth and luxury |
| **Trust Mode** | Light theme ONLY for card linking. Bank-level trust. |
| **Bold Discovery** | Colorful tiles for mood-based exploration |
| **Manrope Typography** | Clean, modern, highly readable |
| **Breathing Space** | Generous whitespace. Let content breathe. |

### Design DNA

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   PREMIUM                   CEEZAA                 SOCIAL   │
│   ───────                   ──────                 ──────   │
│                                                             │
│   Navy depth        ──►     Navy-first      ◄──   Vibrant   │
│   Gold luxury       ──►     Warm gold       ◄──   Colorful  │
│   Sophisticated     ──►     Manrope         ◄──   Modern    │
│   Trust             ──►     Discovery       ◄──   Playful   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Color System

### 2.1 Primary Brand Colors

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY PALETTE                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │          │  │  ██████  │  │  ██████  │                  │
│  │ #FFFFFF  │  │  ██████  │  │  ██████  │                  │
│  │          │  │  ██████  │  │  ██████  │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│   White         Navy          Gold                          │
│   #FFFFFF       #0A1A2F       #D3B481                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Token | Hex | Usage |
|-------|-----|-------|
| `white` | `#FFFFFF` | Text on dark, light backgrounds |
| `navy` | `#0A1A2F` | Primary dark background, logo |
| `gold` | `#D3B481` | Accent, buttons, highlights, logo mark |

### 2.2 Dark Theme (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0A1A2F` | App background, base layer |
| `surface` | `#132138` | Cards, bottom sheets |
| `surfaceAlt` | `#1C2D47` | Elevated cards, active states |
| `surfaceMuted` | `#243752` | Secondary surfaces, dividers |
| `border` | `#2E4562` | Subtle borders |
| `borderMuted` | `#1E3550` | Very subtle separators |

### 2.3 Primary Accent (Gold)

```
┌─────────────────────────────────────────────────────────────┐
│  PRIMARY (CEEZAA GOLD)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  ██████  │  │  ██████  │  │  ██████  │  │  ██████  │    │
│  │  ██████  │  │  ██████  │  │  ██████  │  │  ██████  │    │
│  │  ██████  │  │  ██████  │  │  ██████  │  │  ██████  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│   #D3B481      #C4A572       #B59663       #2A2418         │
│   primary      primaryHover  primaryActive primaryMuted    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#D3B481` | Primary buttons, active tab, links |
| `primaryHover` | `#C4A572` | Hover state |
| `primaryActive` | `#B59663` | Pressed state |
| `primaryMuted` | `#2A2418` | Subtle gold backgrounds |

### 2.4 Grayscale (Official Brand)

```
┌─────────────────────────────────────────────────────────────┐
│  GRAYSCALE PALETTE                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cloud     Smoke     Steel     Space                        │
│  #EDEFF7   #D3D6E0   #BCBFCC   #9DA2B3                      │
│                                                             │
│  Graphite  Arsenic   Phantom   Black                        │
│  #6E7180   #40424D   #1E1E24   #000000                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `cloud` | `#EDEFF7` | Cloud | Light backgrounds |
| `smoke` | `#D3D6E0` | Smoke | Borders on light |
| `steel` | `#BCBFCC` | Steel | Disabled text (light) |
| `space` | `#9DA2B3` | Space | Secondary text |
| `graphite` | `#6E7180` | Graphite | Muted text |
| `arsenic` | `#40424D` | Arsenic | Dark secondary |
| `phantom` | `#1E1E24` | Phantom | Near black |
| `black` | `#000000` | Black | Pure black |

### 2.5 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#FFFFFF` | Headings, important text |
| `textSecondary` | `#9DA2B3` | Body text, descriptions (Space) |
| `textMuted` | `#6E7180` | Captions, hints (Graphite) |
| `textDisabled` | `#40424D` | Disabled states (Arsenic) |

### 2.6 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#22C55E` | Success states, confirmations |
| `warning` | `#F59E0B` | Warnings, caution |
| `error` | `#EF4444` | Errors, destructive actions |
| `info` | `#3B82F6` | Informational |

### 2.7 Mood Palette (Discover Tiles)

Colorful gradients for mood-based discovery:

```
┌─────────────────────────────────────────────────────────────┐
│  MOOD GRADIENTS                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │   │
│  │   ░ CHILL ░   │  │  ░ENERGETIC░  │  │  ░ROMANTIC ░  │   │
│  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│   Indigo            Orange             Pink                 │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │   │
│  │   ░SOCIAL ░   │  │  ░ADVENTURE░  │  │   ░ COZY  ░   │   │
│  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │  │   ░░░░░░░░░   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│   Sky Blue          Teal               Amber                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Mood | Start | End | CSS Gradient |
|------|-------|-----|--------------|
| **Chill** | `#6366F1` | `#4338CA` | `linear-gradient(135deg, #6366F1, #4338CA)` |
| **Energetic** | `#F97316` | `#DC2626` | `linear-gradient(135deg, #F97316, #DC2626)` |
| **Romantic** | `#EC4899` | `#BE185D` | `linear-gradient(135deg, #EC4899, #BE185D)` |
| **Social** | `#0EA5E9` | `#0284C7` | `linear-gradient(135deg, #0EA5E9, #0284C7)` |
| **Adventurous** | `#14B8A6` | `#0D9488` | `linear-gradient(135deg, #14B8A6, #0D9488)` |
| **Cozy** | `#F59E0B` | `#D97706` | `linear-gradient(135deg, #F59E0B, #D97706)` |

### 2.8 Trust Mode (Card Linking Only)

Light theme used ONLY for the card linking screen:

```
┌─────────────────────────────────────────────────────────────┐
│  TRUST MODE (Light)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  background:     #FFFFFF                                    │
│  surface:        #EDEFF7 (Cloud)                            │
│  textPrimary:    #0A1A2F (Navy)                             │
│  textSecondary:  #40424D (Arsenic)                          │
│  border:         #D3D6E0 (Smoke)                            │
│                                                             │
│  Primary button: #D3B481 (Gold)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Token | Hex | Usage |
|-------|-----|-------|
| `trustBackground` | `#FFFFFF` | Card linking background |
| `trustSurface` | `#EDEFF7` | Cards, inputs (Cloud) |
| `trustText` | `#0A1A2F` | Primary text (Navy) |
| `trustTextSecondary` | `#40424D` | Secondary text (Arsenic) |
| `trustBorder` | `#D3D6E0` | Input borders (Smoke) |

---

## 3. Typography

### 3.1 Font Family

**Manrope** - The official Ceezaa typeface.

```
┌─────────────────────────────────────────────────────────────┐
│  MANROPE                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Light      Regular     Medium      Semibold                │
│  Bold       ExtraBold                                       │
│                                                             │
│  Modern, geometric sans-serif with excellent readability.   │
│  Used for ALL text - headings and body.                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Token | Font | Fallback |
|-------|------|----------|
| `fontFamily` | `Manrope` | `system-ui, sans-serif` |

### 3.2 Type Scale (Official Brand)

```
Heading 1    ████████████████████████████████████  64px / ExtraBold
Heading 2    ████████████████████████████          48px / Bold
Subheader 1  ██████████████████████                32px / Semibold
Subheader 2  ████████████████████                  24px / Semibold
Paragraph 1  ████████████████                      18px / Regular
Paragraph 2  ██████████████                        16px / Regular
```

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `h1` | 64px | 800 (ExtraBold) | 1.1 | Hero titles, splash |
| `h2` | 48px | 700 (Bold) | 1.15 | Screen titles |
| `subheader1` | 32px | 600 (SemiBold) | 1.2 | Section headers |
| `subheader2` | 24px | 600 (SemiBold) | 1.25 | Card titles |
| `body1` | 18px | 400 (Regular) | 1.5 | Large body text |
| `body2` | 16px | 400 (Regular) | 1.5 | Default body text |
| `caption` | 14px | 500 (Medium) | 1.4 | Captions, labels |
| `overline` | 12px | 600 (SemiBold) | 1.3 | Overlines, tags |

### 3.3 Mobile Type Scale (Scaled Down)

For React Native mobile screens:

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `h1` | 32px | 700 | Screen titles |
| `h2` | 24px | 600 | Section headers |
| `h3` | 20px | 600 | Card titles |
| `body` | 16px | 400 | Body text |
| `bodySmall` | 14px | 400 | Secondary text |
| `caption` | 12px | 500 | Captions, hints |
| `overline` | 10px | 600 | Tags, labels |

---

## 4. Spacing

4px base unit for consistent rhythm.

```
┌─────────────────────────────────────────────────────────────┐
│  SPACING SCALE (4px base)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  xs   ██          4px    - Tight spacing, icons             │
│  sm   ████        8px    - Related elements                 │
│  md   ████████    16px   - Default padding                  │
│  lg   ████████████ 24px  - Section spacing                  │
│  xl   ████████████████ 32px - Large gaps                    │
│  2xl  ████████████████████ 48px - Screen sections           │
│  3xl  ████████████████████████ 64px - Major sections        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon padding, tight gaps |
| `space-sm` | 8px | Related items, inline spacing |
| `space-md` | 16px | Default padding, card padding |
| `space-lg` | 24px | Section margins |
| `space-xl` | 32px | Large gaps between sections |
| `space-2xl` | 48px | Screen sections |
| `space-3xl` | 64px | Major screen divisions |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Inputs, small buttons |
| `radius-md` | 12px | Cards, buttons |
| `radius-lg` | 16px | Modals, large cards, mood tiles |
| `radius-xl` | 24px | Feature cards |
| `radius-full` | 9999px | Pills, avatars, rounded buttons |

---

## 6. Shadows & Elevation

Navy theme shadows with subtle warmth:

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle lift |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | Cards |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | Modals, sheets |
| `shadow-glow` | `0 0 20px rgba(211,180,129,0.3)` | Gold button glow |

---

## 7. Animation

### 7.1 Duration

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 100ms | Micro-interactions, hovers |
| `duration-normal` | 200ms | Button presses, toggles |
| `duration-slow` | 300ms | Page transitions, modals |
| `duration-slower` | 500ms | Complex animations |

### 7.2 Easing

| Token | Value | Usage |
|-------|-------|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default transitions |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter animations |
| `ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful interactions |

---

## 8. Components

### 8.1 Button

| Variant | Background | Text | Border | Radius |
|---------|------------|------|--------|--------|
| `primary` | `#D3B481` | `#0A1A2F` | none | `full` |
| `secondary` | `transparent` | `#FFFFFF` | `#2E4562` | `full` |
| `ghost` | `transparent` | `#9DA2B3` | none | `md` |
| `danger` | `#EF4444` | `#FFFFFF` | none | `full` |

**Sizes:**
| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | 36px | 16px x 8px | 14px |
| `md` | 48px | 24px x 12px | 16px |
| `lg` | 56px | 32px x 16px | 18px |

### 8.2 Input

| State | Background | Border | Text |
|-------|------------|--------|------|
| Default | `#1C2D47` | `#2E4562` | `#6E7180` (placeholder) |
| Focused | `#1C2D47` | `#D3B481` | `#FFFFFF` |
| Error | `#1C2D47` | `#EF4444` | `#FFFFFF` |

### 8.3 Tab Bar

```
bg: #0A1A2F (navy)
height: 83px (with safe area)
border-top: 1px solid #1E3550

Active: #D3B481 (gold)
Inactive: #6E7180 (graphite)
```

---

## 9. Screen Theme Mapping

| Screen | Theme | Notes |
|--------|-------|-------|
| **Onboarding** |||
| Welcome/Splash | Navy | Premium first impression |
| Auth (Phone/Social) | Navy | Consistent flow |
| OTP Verification | Navy | Consistent flow |
| Quiz | Navy | Fun, engaging |
| Initial Taste Card | Navy | Celebration |
| Card Linking | **Trust (Light)** | Bank trust signals |
| Enhanced Reveal | Navy | Celebration |
| **Main App** |||
| Pulse | Navy | Home, social |
| Discover | Navy | Colorful mood tiles |
| Vault | Navy | Personal history |
| Profile | Navy | Settings |
| **Modals** |||
| Share Sheet | Navy | Consistent with app |
| Session Invite | Navy | Social |
| Venue Detail | Navy | Content focus |

---

## 10. Implementation Guide

### 10.1 Font Setup (Single Config)

```typescript
// design/fonts.ts
export const fonts = {
  family: 'Manrope',
  weights: {
    light: 'Manrope-Light',
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semibold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
    extrabold: 'Manrope-ExtraBold',
  }
} as const;
```

### 10.2 Color Tokens

```typescript
// design/tokens/colors.ts
export const colors = {
  // Brand
  white: '#FFFFFF',
  navy: '#0A1A2F',
  gold: '#D3B481',

  // Dark theme (default)
  dark: {
    background: '#0A1A2F',
    surface: '#132138',
    surfaceAlt: '#1C2D47',
    surfaceMuted: '#243752',
    border: '#2E4562',

    primary: '#D3B481',
    primaryHover: '#C4A572',

    textPrimary: '#FFFFFF',
    textSecondary: '#9DA2B3',
    textMuted: '#6E7180',
  },

  // Trust mode (card linking only)
  trust: {
    background: '#FFFFFF',
    surface: '#EDEFF7',
    textPrimary: '#0A1A2F',
    textSecondary: '#40424D',
    border: '#D3D6E0',
    primary: '#D3B481',
  },

  // Grayscale
  grayscale: {
    cloud: '#EDEFF7',
    smoke: '#D3D6E0',
    steel: '#BCBFCC',
    space: '#9DA2B3',
    graphite: '#6E7180',
    arsenic: '#40424D',
    phantom: '#1E1E24',
    black: '#000000',
  },

  // Mood gradients
  mood: {
    chill: ['#6366F1', '#4338CA'],
    energetic: ['#F97316', '#DC2626'],
    romantic: ['#EC4899', '#BE185D'],
    social: ['#0EA5E9', '#0284C7'],
    adventurous: ['#14B8A6', '#0D9488'],
    cozy: ['#F59E0B', '#D97706'],
  },

  // Semantic
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;
```

### 10.3 NativeWind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A1A2F',
        surface: '#132138',
        'surface-alt': '#1C2D47',
        primary: '#D3B481',
        'text-primary': '#FFFFFF',
        'text-secondary': '#9DA2B3',
        'text-muted': '#6E7180',
      },
      fontFamily: {
        sans: ['Manrope-Regular'],
        'sans-medium': ['Manrope-Medium'],
        'sans-semibold': ['Manrope-SemiBold'],
        'sans-bold': ['Manrope-Bold'],
        'sans-extrabold': ['Manrope-ExtraBold'],
      },
    },
  },
};
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  CEEZAA DESIGN QUICK REFERENCE                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BRAND COLORS                                               │
│  Navy:  #0A1A2F    Gold: #D3B481    White: #FFFFFF         │
│                                                             │
│  TYPOGRAPHY                                                 │
│  Font: Manrope (all weights)                               │
│  H1: 32px Bold    Body: 16px Regular                       │
│                                                             │
│  SPACING (4px base)                                        │
│  xs:4  sm:8  md:16  lg:24  xl:32  2xl:48                   │
│                                                             │
│  RADIUS                                                     │
│  sm:8  md:12  lg:16  xl:24  full:9999                      │
│                                                             │
│  THEME RULE                                                 │
│  Everything NAVY except Card Linking (Trust/Light)         │
│                                                             │
│  LOGO                                                       │
│  Primary: Navy on light    Secondary: Gold on navy          │
│  Logo files: Media_Kit/Logo_files/                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Based on official Ceezaa Brand Guidelines - Dec 2024*
