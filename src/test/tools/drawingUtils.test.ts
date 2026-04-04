import { describe, it, expect } from 'vitest';
import {
  getSelectionBounds,
  isSelectionEmpty,
  createRectSelection,
  createEllipseSelection,
  combineSelections,
} from '../../tools/drawingUtils';

describe('isSelectionEmpty', () => {
  it('returns true for null', () => {
    expect(isSelectionEmpty(null)).toBe(true);
  });

  it('returns true for all-zero mask', () => {
    expect(isSelectionEmpty(new Uint8Array(16))).toBe(true);
  });

  it('returns false when any pixel is selected', () => {
    const mask = new Uint8Array(16);
    mask[5] = 1;
    expect(isSelectionEmpty(mask)).toBe(false);
  });
});

describe('getSelectionBounds', () => {
  it('returns null for empty mask', () => {
    expect(getSelectionBounds(new Uint8Array(16), 4, 4)).toBeNull();
  });

  it('returns single pixel bounds', () => {
    const mask = new Uint8Array(16);
    mask[5] = 1; // x=1, y=1 in 4-wide grid
    expect(getSelectionBounds(mask, 4, 4)).toEqual({
      minX: 1,
      minY: 1,
      maxX: 1,
      maxY: 1,
    });
  });

  it('returns full bounds for multi-pixel selection', () => {
    const mask = new Uint8Array(16);
    mask[0] = 1; // (0,0)
    mask[15] = 1; // (3,3)
    expect(getSelectionBounds(mask, 4, 4)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 3,
      maxY: 3,
    });
  });
});

describe('createRectSelection', () => {
  it('creates correct rectangular mask', () => {
    const mask = createRectSelection(1, 1, 2, 2, 4, 4);
    // Selected: (1,1), (2,1), (1,2), (2,2)
    expect(mask[1 * 4 + 1]).toBe(1);
    expect(mask[1 * 4 + 2]).toBe(1);
    expect(mask[2 * 4 + 1]).toBe(1);
    expect(mask[2 * 4 + 2]).toBe(1);
    // Not selected: (0,0)
    expect(mask[0]).toBe(0);
  });

  it('handles reversed coordinates', () => {
    const mask = createRectSelection(2, 2, 1, 1, 4, 4);
    expect(mask[1 * 4 + 1]).toBe(1);
    expect(mask[2 * 4 + 2]).toBe(1);
  });

  it('clamps to canvas bounds', () => {
    const mask = createRectSelection(-1, -1, 1, 1, 4, 4);
    expect(mask.length).toBe(16);
    // (0,0) and (1,0), (0,1), (1,1) should be selected
    expect(mask[0]).toBe(1);
    expect(mask[1]).toBe(1);
  });
});

describe('createEllipseSelection', () => {
  it('creates non-empty mask for valid ellipse', () => {
    const mask = createEllipseSelection(0, 0, 8, 8, 10, 10);
    expect(isSelectionEmpty(mask)).toBe(false);
  });

  it('returns empty for degenerate ellipse', () => {
    // rx = 0
    const mask = createEllipseSelection(2, 0, 2, 4, 10, 10);
    expect(isSelectionEmpty(mask)).toBe(true);
  });
});

describe('combineSelections', () => {
  it('replace returns incoming mask', () => {
    const existing = new Uint8Array([1, 0, 1, 0]);
    const incoming = new Uint8Array([0, 1, 0, 1]);
    const result = combineSelections(existing, incoming, 'replace');
    expect(Array.from(result)).toEqual([0, 1, 0, 1]);
  });

  it('replace when existing is null', () => {
    const incoming = new Uint8Array([0, 1, 0, 1]);
    const result = combineSelections(null, incoming, 'replace');
    expect(Array.from(result)).toEqual([0, 1, 0, 1]);
  });

  it('add combines both masks', () => {
    const existing = new Uint8Array([1, 0, 0, 1]);
    const incoming = new Uint8Array([0, 1, 0, 1]);
    const result = combineSelections(existing, incoming, 'add');
    expect(Array.from(result)).toEqual([1, 1, 0, 1]);
  });

  it('subtract removes incoming from existing', () => {
    const existing = new Uint8Array([1, 1, 0, 1]);
    const incoming = new Uint8Array([0, 1, 0, 1]);
    const result = combineSelections(existing, incoming, 'subtract');
    expect(Array.from(result)).toEqual([1, 0, 0, 0]);
  });

  it('intersect keeps only overlap', () => {
    const existing = new Uint8Array([1, 1, 0, 1]);
    const incoming = new Uint8Array([0, 1, 0, 1]);
    const result = combineSelections(existing, incoming, 'intersect');
    expect(Array.from(result)).toEqual([0, 1, 0, 1]);
  });
});
