import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../../store/settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetAll();
  });

  it('getValue returns default when no override', () => {
    // Pick any valid setting id from defaults
    const vals = useSettingsStore.getState().values;
    const firstKey = Object.keys(vals)[0];
    if (firstKey) {
      const def = vals[firstKey];
      expect(useSettingsStore.getState().getValue(firstKey)).toBe(def);
    }
  });

  it('setValue persists and retrieves value', () => {
    useSettingsStore.getState().setValue('test.setting', 42);
    expect(useSettingsStore.getState().getValue('test.setting')).toBe(42);
  });

  it('resetValue restores default', () => {
    const vals = useSettingsStore.getState().values;
    const firstKey = Object.keys(vals)[0];
    if (firstKey) {
      const original = vals[firstKey];
      useSettingsStore.getState().setValue(firstKey, 'changed');
      useSettingsStore.getState().resetValue(firstKey);
      expect(useSettingsStore.getState().getValue(firstKey)).toBe(original);
    }
  });

  it('resetAll restores all defaults', () => {
    useSettingsStore.getState().setValue('test.a', 1);
    useSettingsStore.getState().setValue('test.b', 2);
    useSettingsStore.getState().resetAll();
    expect(useSettingsStore.getState().getValue('test.a')).toBeUndefined();
    expect(useSettingsStore.getState().getValue('test.b')).toBeUndefined();
  });

  describe('legacy settings', () => {
    it('updates app settings partially', () => {
      useSettingsStore.getState().updateSettings({ gridSize: 32 });
      expect(useSettingsStore.getState().appSettings.gridSize).toBe(32);
      // Other fields unchanged
      expect(useSettingsStore.getState().appSettings.gridSnapping).toBe(true);
    });
  });

  describe('settings visibility', () => {
    it('opens and closes settings', () => {
      expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
      useSettingsStore.getState().openSettings();
      expect(useSettingsStore.getState().isSettingsOpen).toBe(true);
      useSettingsStore.getState().closeSettings();
      expect(useSettingsStore.getState().isSettingsOpen).toBe(false);
    });
  });
});
