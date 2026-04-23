// Theme configuration - centralized colors and design tokens
// Single source of truth for all UI colors

export const theme = {
  colors: {
    // Backgrounds
    background: '#0a0a0a',      // Main dark background
    surface: '#141414',         // Card/tile backgrounds
    border: '#262626',          // Borders and dividers

    // Accent
    accent: '#d4af37',          // Gold - primary accent color
    accentHover: '#c9a132',     // Gold hover state

    // Text
    text: '#f5f5f5',            // Primary text
    textSecondary: '#a0a0a0',    // Secondary/muted text

    // Semantic
    success: '#22c55e',          // Green - available stock, success states
    error: '#ef4444',            // Red - errors, out of stock
    warning: '#f59e0b',          // Orange - warnings

    // UI States
    disabled: '#4a4a4a',        // Disabled button background
    disabledText: '#888888',     // Disabled button text
  },

  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      '2xl': '2rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
  },
} as const

export type Theme = typeof theme

export default theme
