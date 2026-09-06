/**
 * Centralized Brand & Application Assets Configuration
 */
export const brand = {
  name: 'PeoplePay 360',
  shortName: 'PeoplePay 360',
  logo: '/logo.png',
  logoMark: '/logo.png',
  favicon: '/logo.png',
  googleLogo: '/bussiness/google.png',
  tagline: 'Complete HR & Payroll Management System',
} as const;

export type Brand = typeof brand;
