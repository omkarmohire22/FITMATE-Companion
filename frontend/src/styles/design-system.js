/**
 * FitMate Design System
 * Unified professional UI configuration for all dashboards
 */

// Color Palette - Professional Gym Theme
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',    // Main primary
    600: '#0284c7',    // Hover state
    700: '#0369a1',    // Active state
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',    // Secondary accent
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral - Professional grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Semantic colors for dashboard elements
  chart: {
    blue: '#0ea5e9',
    purple: '#a855f7',
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
    pink: '#ec4899',
  }
};

// Typography System
export const typography = {
  // Font family
  fontFamily: {
    base: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },
  
  // Font sizes and line heights
  fontSize: {
    xs: { size: '12px', height: '16px' },
    sm: { size: '14px', height: '20px' },
    base: { size: '16px', height: '24px' },
    lg: { size: '18px', height: '28px' },
    xl: { size: '20px', height: '30px' },
    '2xl': { size: '24px', height: '32px' },
    '3xl': { size: '30px', height: '36px' },
    '4xl': { size: '36px', height: '44px' },
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
};

// Spacing System (consistent rhythm)
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
};

// Border Radius
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// Shadows - Professional depth
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Transitions
export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// Component Size Presets
export const sizes = {
  button: {
    sm: { padding: '8px 12px', fontSize: '14px', height: '32px' },
    md: { padding: '10px 16px', fontSize: '16px', height: '40px' },
    lg: { padding: '12px 20px', fontSize: '16px', height: '48px' },
  },
  input: {
    height: '40px',
    padding: '10px 12px',
    fontSize: '16px',
  },
  card: {
    padding: { sm: '16px', md: '20px', lg: '24px' },
  }
};

// Layout Constraints
export const layout = {
  maxWidth: '1280px',
  containerPadding: { sm: '16px', md: '24px', lg: '32px' },
  sidebarWidth: '280px',
  headerHeight: '64px',
};

// Responsive Breakpoints
export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-Index Scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  backdrop: 1040,
  offcanvas: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
};

// Status Badge Styles
export const statusStyles = {
  success: {
    bg: '#d1fae5',
    text: '#065f46',
    border: '#a7f3d0',
  },
  warning: {
    bg: '#fef3c7',
    text: '#92400e',
    border: '#fde68a',
  },
  error: {
    bg: '#fee2e2',
    text: '#7f1d1d',
    border: '#fecaca',
  },
  info: {
    bg: '#dbeafe',
    text: '#1e40af',
    border: '#bfdbfe',
  },
};

// Dashboard Component Spacing
export const dashboardSpacing = {
  gutter: '24px',           // Between grid items
  sectionGap: '32px',       // Between sections
  cardPadding: '20px',      // Inside cards
  headerGap: '16px',        // Header elements
};

// Animation Presets
export const animations = {
  // Framer motion duration in ms
  duration: {
    quick: 150,
    base: 200,
    slow: 300,
    slowest: 500,
  },
  // Common easing functions
  easing: {
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    easeInOut: 'easeInOut',
    circIn: 'circIn',
    circOut: 'circOut',
  }
};

// Gradient Presets
export const gradients = {
  primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
  secondary: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  sizes,
  layout,
  breakpoints,
  zIndex,
  statusStyles,
  dashboardSpacing,
  animations,
  gradients,
};
