/**
 * Centralized Brand & Application Assets Configuration
 * 
 * Update brand details and logos here to rebrand the application.
 */
export const brand = {
  name: 'Ashish Vekariya',
  shortName: 'Hackathon UI',
  logo: '/logo.png',
  logoMark: '/logo.png',
  favicon: '/logo.png',
  googleLogo: '/bussiness/google.png',
  tagline: 'A complete end to end system ',
} as const;

export type Brand = typeof brand;
