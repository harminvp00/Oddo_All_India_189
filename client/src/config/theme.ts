/**
 * SINGLE SOURCE OF TRUTH FOR THE PEOPLEPAY360 UI COLOR SYSTEM
 * 
 * Implements the Cuberto-inspired typography and Odoo-inspired enterprise 
 * color tokens (#714B67 purple primary, #017E84 teal secondary, #F7F7F8 canvas).
 */

export const themeConfig = {
  brand: {
    // Primary Brand Color (Deep Odoo-inspired Purple)
    primary: '#714B67',
    hover: '#5B3A52',
    active: '#482C40',
    soft: '#F5EFF4',
    subtle: '#FAF6F9',
    foreground: '#FFFFFF',

    // Secondary Brand Color (Teal Accent)
    secondary: '#017E84',
    secondaryHover: '#00686D',
    secondarySoft: '#E6F4F4',
  },
  layers: {
    // Shell: Clean light surface
    shellBg: '#FFFFFF',
    shellBorder: '#E5E7EB',
    
    // Main Canvas: Neutral background for enterprise SaaS
    canvas: '#F7F7F8',
    
    // Surfaces: Crisp white cards floating over canvas
    surface: '#FFFFFF',
    surfaceMuted: '#FAFAFA',
  },
  typography: {
    fontSans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  },
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },
} as const;

export type ThemeConfig = typeof themeConfig;

