// Design Tokens for FitMate Pro
export const designTokens = {
  // Color Palette
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    accent: {
      50: '#fef3c7',
      100: '#fde68a',
      200: '#fcd34d',
      300: '#fbbf24',
      400: '#f59e0b',
      500: '#d97706',
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
      950: '#271002'
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      primary: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      secondary: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
      '8xl': '6rem',    // 96px
      '9xl': '8rem'     // 128px
    },
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // Spacing Scale
  spacing: {
    0: '0px',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    9: '2.25rem',   // 36px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    14: '3.5rem',   // 56px
    16: '4rem',     // 64px
    18: '4.5rem',   // 72px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    28: '7rem',     // 112px
    32: '8rem',     // 128px
    36: '9rem',     // 144px
    40: '10rem',    // 160px
    44: '11rem',    // 176px
    48: '12rem',    // 192px
    52: '13rem',    // 208px
    56: '14rem',    // 224px
    60: '15rem',    // 240px
    64: '16rem',    // 256px
    72: '18rem',    // 288px
    80: '20rem',    // 320px
    96: '24rem'     // 384px
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Z-index scale
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    auto: 'auto'
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  }
}

// Theme variants for different sections
export const themes = {
  admin: {
    primary: designTokens.colors.primary,
    secondary: designTokens.colors.secondary,
    accent: designTokens.colors.accent,
    background: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[800],
      tertiary: designTokens.colors.neutral[700]
    },
    text: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[300],
      tertiary: designTokens.colors.neutral[400]
    }
  },
  trainer: {
    primary: designTokens.colors.secondary,
    secondary: designTokens.colors.primary,
    accent: designTokens.colors.warning,
    background: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[100],
      tertiary: designTokens.colors.neutral[200]
    },
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[600],
      tertiary: designTokens.colors.neutral[500]
    }
  },
  trainee: {
    primary: designTokens.colors.accent,
    secondary: designTokens.colors.primary,
    accent: designTokens.colors.secondary,
    background: {
      primary: designTokens.colors.neutral[50],
      secondary: designTokens.colors.neutral[100],
      tertiary: designTokens.colors.neutral[200]
    },
    text: {
      primary: designTokens.colors.neutral[900],
      secondary: designTokens.colors.neutral[600],
      tertiary: designTokens.colors.neutral[500]
    }
  }
}

// Utility functions
export const getColor = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], designTokens.colors)
}

export const getSpacing = (key) => designTokens.spacing[key] || key
export const getBorderRadius = (key) => designTokens.borderRadius[key] || key
export const getShadow = (key) => designTokens.shadows[key] || key
export const getTransition = (key) => designTokens.transitions[key] || key

// CSS Custom Properties for runtime theming
export const cssVariables = {
  // Colors
  '--color-primary-50': designTokens.colors.primary[50],
  '--color-primary-500': designTokens.colors.primary[500],
  '--color-primary-600': designTokens.colors.primary[600],
  '--color-primary-700': designTokens.colors.primary[700],

  '--color-secondary-50': designTokens.colors.secondary[50],
  '--color-secondary-500': designTokens.colors.secondary[500],
  '--color-secondary-600': designTokens.colors.secondary[600],
  '--color-secondary-700': designTokens.colors.secondary[700],

  '--color-accent-50': designTokens.colors.accent[50],
  '--color-accent-500': designTokens.colors.accent[500],
  '--color-accent-600': designTokens.colors.accent[600],
  '--color-accent-700': designTokens.colors.accent[700],

  '--color-neutral-50': designTokens.colors.neutral[50],
  '--color-neutral-100': designTokens.colors.neutral[100],
  '--color-neutral-200': designTokens.colors.neutral[200],
  '--color-neutral-300': designTokens.colors.neutral[300],
  '--color-neutral-400': designTokens.colors.neutral[400],
  '--color-neutral-500': designTokens.colors.neutral[500],
  '--color-neutral-600': designTokens.colors.neutral[600],
  '--color-neutral-700': designTokens.colors.neutral[700],
  '--color-neutral-800': designTokens.colors.neutral[800],
  '--color-neutral-900': designTokens.colors.neutral[900],

  // Typography
  '--font-family-primary': designTokens.typography.fontFamily.primary.join(', '),
  '--font-family-secondary': designTokens.typography.fontFamily.secondary.join(', '),

  // Spacing
  '--spacing-1': designTokens.spacing[1],
  '--spacing-2': designTokens.spacing[2],
  '--spacing-3': designTokens.spacing[3],
  '--spacing-4': designTokens.spacing[4],
  '--spacing-6': designTokens.spacing[6],
  '--spacing-8': designTokens.spacing[8],

  // Border radius
  '--border-radius-sm': designTokens.borderRadius.sm,
  '--border-radius-md': designTokens.borderRadius.md,
  '--border-radius-lg': designTokens.borderRadius.lg,
  '--border-radius-xl': designTokens.borderRadius.xl,
  '--border-radius-2xl': designTokens.borderRadius['2xl'],

  // Shadows
  '--shadow-sm': designTokens.shadows.sm,
  '--shadow-md': designTokens.shadows.md,
  '--shadow-lg': designTokens.shadows.lg,
  '--shadow-xl': designTokens.shadows.xl,

  // Transitions
  '--transition-fast': designTokens.transitions.fast,
  '--transition-normal': designTokens.transitions.normal,
  '--transition-slow': designTokens.transitions.slow
}
