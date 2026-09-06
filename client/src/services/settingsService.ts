import { api } from './api';

export interface CompanySettings {
  companyName: string;
  cinNumber: string;
  gstin: string;
  adminEmail: string;
  companyAddress: string;
  payrollCutoff: string;
  pfRate: string;
  currency: string;
}

export interface NotificationSettings {
  payrunNotice: boolean;
  leaveRequestUpdates: boolean;
  contractExpiryWarnings: boolean;
  attendanceCorrectionRequests: boolean;
}

export interface ProfileSettings {
  fullName: string;
  email: string;
  role: string;
}

export interface OrganizationSettings {
  company: CompanySettings;
  notifications: NotificationSettings;
  profile: ProfileSettings;
}

export const DEFAULT_SETTINGS: OrganizationSettings = {
  company: {
    companyName: 'PeoplePay360 Technologies Pvt. Ltd.',
    cinNumber: 'CIN-U12345MH2026PTC123456',
    gstin: '27AADCB2230M1Z2',
    adminEmail: 'admin@peoplepay360.com',
    companyAddress: 'Level 4, Infinity Tower, BKC, Mumbai - 400051',
    payrollCutoff: '25',
    pfRate: '12',
    currency: 'INR',
  },
  notifications: {
    payrunNotice: true,
    leaveRequestUpdates: true,
    contractExpiryWarnings: true,
    attendanceCorrectionRequests: true,
  },
  profile: {
    fullName: 'Krish Patel',
    email: 'admin@peoplepay360.com',
    role: 'SUPER ADMIN (Full System Privileges)',
  },
};

const LOCAL_STORAGE_KEY = 'peoplepay360_org_settings';

export const settingsService = {
  getSettings: async (): Promise<OrganizationSettings> => {
    try {
      const res = await api.get<{ success: boolean; data: OrganizationSettings }>('/settings');
      if (res?.data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Backend settings fetch failed, falling back to cache:', err);
    }

    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore cache parse error
    }

    return DEFAULT_SETTINGS;
  },

  updateSettings: async (settings: OrganizationSettings): Promise<OrganizationSettings> => {
    // 1. Immediately cache in localStorage for instant offline & reload recovery
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to write settings to localStorage:', e);
    }

    // 2. Persist to backend server API
    try {
      const res = await api.put<{ success: boolean; data: OrganizationSettings }>('/settings', settings);
      if (res?.data) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.data));
        return res.data;
      }
    } catch (err) {
      console.warn('Backend settings update failed, preserved in local cache:', err);
    }

    return settings;
  },
};
