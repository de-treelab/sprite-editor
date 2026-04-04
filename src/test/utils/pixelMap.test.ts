import { describe, it, expect } from 'vitest';
import { PixelMap } from '../../utils/pixelMap';

describe('PixelMap', () => {
  it('creates with correct dimensions', () => {
    const pm = new PixelMap(4, 4);
    expect(pm.width).toBe(4);
    expect(pm.height).toBe(4);
    expect(pm.data.length).toBe(4 * 4 * 4);
  });

  it('initializes to zeros', () => {
    const pm = new PixelMap(2, 2);
    expect(pm.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('sets and gets pixels', () => {
    const pm = new PixelMap(4, 4);
    pm.setPixel(1, 2, 255, 128, 0, 200);
    expect(pm.getPixel(1, 2)).toEqual({ r: 255, g: 128, b: 0, a: 200 });
  });

  it('defaults alpha to 255', () => {
    const pm = new PixelMap(4, 4);
    pm.setPixel(0, 0, 10, 20, 30);
    expect(pm.getPixel(0, 0)!.a).toBe(255);
  });

  it('ignores out-of-bounds set', () => {
    const pm = new PixelMap(2, 2);
    pm.setPixel(-1, 0, 255, 0, 0);
    pm.setPixel(0, 5, 255, 0, 0);
    pm.setPixel(2, 0, 255, 0, 0);
    // All pixels should remain zero
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        expect(pm.getPixel(x, y)!.r).toBe(0);
      }
    }
  });

  it('returns null for out-of-bounds get', () => {
    const pm = new PixelMap(2, 2);
    expect(pm.getPixel(-1, 0)).toBeNull();
    expect(pm.getPixel(0, 2)).toBeNull();
    expect(pm.getPixel(2, 0)).toBeNull();
  });

  it('clones independently', () => {
    const pm = new PixelMap(2, 2);
    pm.setPixel(0, 0, 100, 200, 50, 255);
    const clone = pm.clone();

    expect(clone.getPixel(0, 0)).toEqual({ r: 100, g: 200, b: 50, a: 255 });

    // Modifying clone does not affect original
    clone.setPixel(0, 0, 0, 0, 0, 0);
    expect(pm.getPixel(0, 0)!.r).toBe(100);
  });

  it('accepts existing data in constructor', () => {
    const data = new Uint8Array(2 * 2 * 4);
    data[0] = 42;
    const pm = new PixelMap(2, 2, data);
    expect(pm.getPixel(0, 0)!.r).toBe(42);

    // Should be a copy, not a reference
    data[0] = 99;
    expect(pm.getPixel(0, 0)!.r).toBe(42);
  });

  it('ignores existing data with wrong length', () => {
    const data = new Uint8Array(5); // wrong length
    const pm = new PixelMap(2, 2, data);
    expect(pm.data.length).toBe(2 * 2 * 4);
    expect(pm.getPixel(0, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });
});
