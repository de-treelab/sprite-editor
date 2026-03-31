import { create } from 'zustand';
import { allSettings } from '../config/settingsRegistry';
import { getDefaults } from '../config/settings';

const STORAGE_KEY = 'editorSettings';

function loadPersistedValues(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt storage */ }
  return {};
}

function persist(values: Record<string, unknown>) {
  // Only persist non-default values
  const defaults = getDefaults(allSettings);
  const sparse: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v !== defaults[k]) sparse[k] = v;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sparse));
}

// Legacy app settings kept for backward compat
interface AppSettings {
  gridSnapping: boolean;
  gridSize: number;
  onionSkinning: boolean;
  onionSkinFramesPrev: number;
  onionSkinFramesNext: number;
}

interface SettingsState {
  // Legacy
  appSettings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Generic settings store
  values: Record<string, unknown>;
  getValue: <T = unknown>(id: string) => T;
  setValue: (id: string, value: unknown) => void;
  resetValue: (id: string) => void;
  resetAll: () => void;

  // Settings page visibility
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const defaults = getDefaults(allSettings);
const persisted = loadPersistedValues();
const initialValues: Record<string, unknown> = { ...defaults, ...persisted };

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Legacy
  appSettings: {
    gridSnapping: true,
    gridSize: 16,
    onionSkinning: true,
    onionSkinFramesPrev: 1,
    onionSkinFramesNext: 1,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      appSettings: { ...state.appSettings, ...newSettings },
    })),

  // Generic settings
  values: initialValues,

  getValue: <T = unknown>(id: string): T => {
    const v = get().values[id];
    return (v !== undefined ? v : defaults[id]) as T;
  },

  setValue: (id, value) => {
    const next = { ...get().values, [id]: value };
    persist(next);
    set({ values: next });
  },

  resetValue: (id) => {
    const next = { ...get().values };
    delete next[id];
    if (defaults[id] !== undefined) next[id] = defaults[id];
    persist(next);
    set({ values: next });
  },

  resetAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ values: { ...defaults } });
  },

  isSettingsOpen: false,
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
}));