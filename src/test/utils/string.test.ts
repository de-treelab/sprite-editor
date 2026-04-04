import { describe, it, expect } from 'vitest';
import { normalizeProjectName } from '../../utils/string';

describe('normalizeProjectName', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(normalizeProjectName('My Project')).toBe('my-project');
  });

  it('removes special characters', () => {
    expect(normalizeProjectName('Hello!@#World')).toBe('hello-world');
  });

  it('trims leading/trailing hyphens', () => {
    expect(normalizeProjectName('--test--')).toBe('test');
  });

  it('collapses consecutive special chars to single hyphen', () => {
    expect(normalizeProjectName('a   b...c')).toBe('a-b-c');
  });

  it('handles empty string', () => {
    expect(normalizeProjectName('')).toBe('');
  });

  it('preserves numbers', () => {
    expect(normalizeProjectName('Sprite Sheet 2')).toBe('sprite-sheet-2');
  });

  it('handles all-special-char input', () => {
    expect(normalizeProjectName('!!!')).toBe('');
  });
});
