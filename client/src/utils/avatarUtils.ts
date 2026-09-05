// Utility for persisting and resolving employee profile pictures / avatars

const AVATAR_STORAGE_KEY = 'peoplepay360_employee_avatars';

// Default avatars mapped to seed employee codes/emails
const SEED_AVATAR_MAP: Record<string, string> = {
  EMP0001: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', // Rahul Sharma
  EMP0002: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', // Amit Patel
  EMP0003: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', // Neha Shah
  EMP0004: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', // Priya Mehta
  EMP0005: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', // Sunil Verma
  EMP0006: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', // Deepa Krishnan
  'rahul.sharma@peoplepay360.com': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'amit.patel@peoplepay360.com': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'neha.shah@peoplepay360.com': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'priya.mehta@peoplepay360.com': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'sunil.verma@peoplepay360.com': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'deepa.k@peoplepay360.com': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
};

export const getStoredAvatar = (employeeIdOrCode: string): string | null => {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[employeeIdOrCode]) return map[employeeIdOrCode];
    }
  } catch {
    // fallback to seed map
  }
  return SEED_AVATAR_MAP[employeeIdOrCode] || null;
};

export const setStoredAvatar = (employeeIdOrCode: string, avatarDataUrl: string): void => {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[employeeIdOrCode] = avatarDataUrl;
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to save avatar to localStorage:', err);
  }
};

export const removeStoredAvatar = (employeeIdOrCode: string): void => {
  try {
    const raw = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (!raw) return;
    const map = JSON.parse(raw);
    delete map[employeeIdOrCode];
    localStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to remove avatar from localStorage:', err);
  }
};

// Preset professional avatars for fast selection
export const PRESET_AVATARS = [
  {
    id: 'preset-1',
    label: 'Male Professional 1',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-2',
    label: 'Male Professional 2',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-3',
    label: 'Female Professional 1',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-4',
    label: 'Female Professional 2',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-5',
    label: 'Executive 1',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset-6',
    label: 'Executive 2',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
];
