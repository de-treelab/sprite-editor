import { describe, it, expect } from 'vitest';
import { buildCategoryTree, getDefaults, type SettingDefinition } from '../../config/settings';

const testSettings: SettingDefinition[] = [
  {
    id: 'editor.fontSize',
    label: 'Font Size',
    category: 'editor',
    type: 'number',
    default: 14,
    min: 8,
    max: 72,
  },
  {
    id: 'editor.theme',
    label: 'Theme',
    category: 'editor',
    type: 'string',
    default: 'dark',
  },
  {
    id: 'editor.keybindings.save',
    label: 'Save',
    category: 'editor.keybindings',
    type: 'keybinding',
    default: 'Ctrl+S',
  },
  {
    id: 'git.autoFetch',
    label: 'Auto Fetch',
    category: 'git',
    type: 'boolean',
    default: true,
  },
];

describe('settings', () => {
  describe('getDefaults', () => {
    it('returns default value for each setting', () => {
      const defs = getDefaults(testSettings);
      expect(defs['editor.fontSize']).toBe(14);
      expect(defs['editor.theme']).toBe('dark');
      expect(defs['editor.keybindings.save']).toBe('Ctrl+S');
      expect(defs['git.autoFetch']).toBe(true);
    });

    it('returns empty object for empty settings', () => {
      expect(getDefaults([])).toEqual({});
    });
  });

  describe('buildCategoryTree', () => {
    it('creates top-level categories', () => {
      const tree = buildCategoryTree(testSettings);
      const ids = tree.map((n) => n.id);
      expect(ids).toContain('editor');
      expect(ids).toContain('git');
    });

    it('nests subcategories', () => {
      const tree = buildCategoryTree(testSettings);
      const editor = tree.find((n) => n.id === 'editor');
      expect(editor).toBeDefined();
      expect(editor!.children.some((c) => c.id === 'editor.keybindings')).toBe(true);
    });

    it('returns empty array for empty settings', () => {
      expect(buildCategoryTree([])).toEqual([]);
    });

    it('handles orphan categories by creating implicit parents', () => {
      const orphan: SettingDefinition[] = [
        {
          id: 'x.y.z.val',
          label: 'Val',
          category: 'x.y.z',
          type: 'string',
          default: '',
        },
      ];
      const tree = buildCategoryTree(orphan);
      // Should create an implicit parent
      expect(tree.length).toBeGreaterThan(0);
    });
  });
});
