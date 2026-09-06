import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sendSuccess, sendError } from '../../utils/response';

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

const DEFAULT_SETTINGS: OrganizationSettings = {
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

const DATA_DIR = path.resolve(__dirname, '../../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const loadSettingsFromDisk = (): OrganizationSettings => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        company: { ...DEFAULT_SETTINGS.company, ...(parsed.company || {}) },
        notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
        profile: { ...DEFAULT_SETTINGS.profile, ...(parsed.profile || {}) },
      };
    }
  } catch (err) {
    console.warn('Failed to read settings from disk, using defaults:', err);
  }
  return DEFAULT_SETTINGS;
};

const saveSettingsToDisk = (settings: OrganizationSettings): void => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write settings to disk:', err);
  }
};

let cachedSettings: OrganizationSettings = loadSettingsFromDisk();

export const handleGetSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    cachedSettings = loadSettingsFromDisk();
    sendSuccess(res, cachedSettings, 200);
  } catch (error) {
    sendError(res, 'SETTINGS_FETCH_FAILED', (error as Error).message, 500);
  }
};

export const handleUpdateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};

    const updated: OrganizationSettings = {
      company: {
        ...cachedSettings.company,
        ...(body.company || {}),
      },
      notifications: {
        ...cachedSettings.notifications,
        ...(body.notifications || {}),
      },
      profile: {
        ...cachedSettings.profile,
        ...(body.profile || {}),
      },
    };

    cachedSettings = updated;
    saveSettingsToDisk(updated);

    sendSuccess(res, updated, 200);
  } catch (error) {
    sendError(res, 'SETTINGS_UPDATE_FAILED', (error as Error).message, 500);
  }
};

