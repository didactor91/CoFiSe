// Theme configuration - centralized colors and design tokens
// Single source of truth for all UI colors

export const theme = {
  colors: {
    // Backgrounds
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',

    // Accent
    accent: '#0f172a',
    accentHover: '#334155',

    // Text
    text: '#0f172a',
    textSecondary: '#64748b',

    // Semantic
    success: '#22c55e',          // Green - available stock, success states
    error: '#ef4444',            // Red - errors, out of stock
    warning: '#f59e0b',          // Orange - warnings

    // UI States
    disabled: '#cbd5e1',
    disabledText: '#64748b',
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
