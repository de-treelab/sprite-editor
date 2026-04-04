import { describe, it, expect } from 'vitest';
import { formatKeybinding, commandDisplayName } from '../../components/CommandPalette/commandUtils';

describe('formatKeybinding', () => {
  it('capitalizes modifier keys', () => {
    expect(formatKeybinding('ctrl+shift+s')).toBe('Ctrl+Shift+S');
  });

  it('replaces arrow names with symbols', () => {
    expect(formatKeybinding('up')).toBe('↑');
    expect(formatKeybinding('down')).toBe('↓');
    expect(formatKeybinding('left')).toBe('←');
    expect(formatKeybinding('right')).toBe('→');
  });

  it('replaces special key names', () => {
    expect(formatKeybinding('space')).toBe('Space');
    expect(formatKeybinding('delete')).toBe('Del');
    expect(formatKeybinding('escape')).toBe('Esc');
  });

  it('uppercases single letter keys', () => {
    expect(formatKeybinding('b')).toBe('B');
  });

  it('handles complex combos', () => {
    expect(formatKeybinding('ctrl+alt+delete')).toBe('Ctrl+Alt+Del');
  });
});

describe('commandDisplayName', () => {
  const mockT = (key: string, fallback: string) => fallback || key;

  it('derives name from last segment of key', () => {
    expect(commandDisplayName('global.saveProject', mockT)).toBe('Save Project');
  });

  it('splits camelCase into words', () => {
    expect(commandDisplayName('canvas.toolPencil', mockT)).toBe('Tool Pencil');
  });

  it('handles simple keys without dots', () => {
    expect(commandDisplayName('undo', mockT)).toBe('Undo');
  });

  it('uses translation when available', () => {
    const tWithTranslation = (key: string, _fallback: string) => {
      if (key === 'command.global.save') return 'Save File';
      return '';
    };
    expect(commandDisplayName('global.save', tWithTranslation)).toBe('Save File');
  });
});
