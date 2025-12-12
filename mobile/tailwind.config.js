/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors (used as accents)
        white: '#FFFFFF',
        navy: '#0A1A2F',
        gold: '#D3B481',

        // Dark theme surfaces
        background: '#0A0A0A',
        surface: '#141414',
        'surface-alt': '#1A1A1A',
        'surface-muted': '#242424',
        border: '#2A2A2A',
        'border-muted': '#1E1E1E',

        // Primary (Gold)
        primary: {
          DEFAULT: '#D3B481',
          hover: '#C4A572',
          active: '#B59663',
          muted: '#2A2418',
        },

        // Grayscale
        cloud: '#EDEFF7',
        smoke: '#D3D6E0',
        steel: '#BCBFCC',
        space: '#9DA2B3',
        graphite: '#6E7180',
        arsenic: '#40424D',
        phantom: '#1E1E24',

        // Text
        'text-primary': '#FFFFFF',
        'text-secondary': '#9DA2B3',
        'text-muted': '#6E7180',
        'text-disabled': '#40424D',

        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Trust mode (light theme for card linking)
        trust: {
          bg: '#FFFFFF',
          surface: '#EDEFF7',
          text: '#0A1A2F',
          'text-secondary': '#40424D',
          border: '#D3D6E0',
        },

        // Mood gradients (start colors)
        mood: {
          chill: '#6366F1',
          energetic: '#F97316',
          romantic: '#EC4899',
          social: '#0EA5E9',
          adventurous: '#14B8A6',
          cozy: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
