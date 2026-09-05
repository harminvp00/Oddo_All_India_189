/**
 * SINGLE SOURCE OF TRUTH FOR THE UI COLOR SYSTEM
 * 
 * Changing `themeConfig.brand.primary` (or updating `--brand` in CSS)
 * propagates throughout the entire application shell, navigation, canvas,
 * components, buttons, form focus rings, splash screen, and auth pages.
 */

export const themeConfig = {
  brand: {
    // Primary Brand Color (Vibrant Blue Theme)
    primary: '#2563eb',         // Blue-600 (#2563eb) / #2D8AD1
    hover: '#1d4ed8',           // Blue-700
    active: '#1e40af',          // Blue-800
    soft: '#eff6ff',            // Light blue tint (Blue-50) - active nav pills & badge bg
    subtle: '#f0f9ff',          // Subtle blue tint (Sky-50) - soft section accents
    foreground: '#ffffff',      // Primary button text
  },
  layers: {
    // Shell: Sidebar + Navbar matching visual family
    shellBg: '#ffffff',         // Clean light surface background
    shellBorder: '#dbeafe',     // Subtle blue-tinted divider border (Blue-100)
    
    // Main Canvas: Soft blue-tinted background for the workspace canvas
    canvas: '#f0f7ff',          // Light blue-tinted canvas background
    
    // Surfaces: Crisp white cards floating over canvas
    surface: '#ffffff',         // White card / form / table surface
    surfaceMuted: '#f8fafc',    // Soft surface fill
  },
  typography: {
    fontSans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontMono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    full: '9999px',
  },
} as const;

export type ThemeConfig = typeof themeConfig;
