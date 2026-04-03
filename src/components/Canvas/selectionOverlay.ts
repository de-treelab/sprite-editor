import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';

/**
 * Cached boundary segments — recomputed only when the selection mask changes.
 */
let cachedSegments: [number, number, number, number][] = [];
let cachedMaskRef: Uint8Array | null | undefined = undefined; // sentinel: undefined = never computed

/**
 * Recompute boundary segments from the selection mask.
 * Call this when the mask reference changes.
 */
export function invalidateSelectionSegments() {
  cachedMaskRef = undefined;
}

function ensureSegments(mask: Uint8Array | null, canvasWidth: number, canvasHeight: number) {
  if (mask === cachedMaskRef) return;
  cachedMaskRef = mask;
  cachedSegments = [];

  if (!mask) return;

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      if (!mask[y * canvasWidth + x]) continue;

      if (y === 0 || !mask[(y - 1) * canvasWidth + x]) {
        cachedSegments.push([x, y, x + 1, y]);
      }
      if (y === canvasHeight - 1 || !mask[(y + 1) * canvasWidth + x]) {
        cachedSegments.push([x, y + 1, x + 1, y + 1]);
      }
      if (x === 0 || !mask[y * canvasWidth + (x - 1)]) {
        cachedSegments.push([x, y, x, y + 1]);
      }
      if (x === canvasWidth - 1 || !mask[y * canvasWidth + (x + 1)]) {
        cachedSegments.push([x + 1, y, x + 1, y + 1]);
      }
    }
  }
}

/**
 * Draw marching ants along the cached boundary segments.
 * The O(w×h) scan only runs when the mask reference changes.
 */
export function drawSelectionOverlay(
  selectionGraphics: PIXI.Graphics,
  viewport: PIXI.Container,
  canvasWidth: number,
  canvasHeight: number,
  marchingAntsOffset: number,
) {
  selectionGraphics.clear();
  const mask = useEditorStore.getState().selectionMask;
  if (!mask) {
    cachedMaskRef = null;
    cachedSegments = [];
    return;
  }

  ensureSegments(mask, canvasWidth, canvasHeight);

  if (cachedSegments.length === 0) return;

  const strokeWidth = 1 / (viewport.scale.x || 1);
  const dashLen = 4 / (viewport.scale.x || 1);

  // Draw each segment as a dashed line with marching ants
  for (const [ax, ay, bx, by] of cachedSegments) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    const nx = dx / len;
    const ny = dy / len;

    let dash = true;
    let phase = (marchingAntsOffset / (viewport.scale.x || 1)) % (dashLen * 2);
    if (phase > dashLen) {
      dash = false;
      phase -= dashLen;
    }
    let d = -phase;

    while (d < len) {
      const segStart = Math.max(0, d);
      const segEnd = Math.min(len, d + dashLen);
      if (segEnd > segStart && dash) {
        selectionGraphics.moveTo(ax + nx * segStart, ay + ny * segStart);
        selectionGraphics.lineTo(ax + nx * segEnd, ay + ny * segEnd);
        selectionGraphics.stroke({ width: strokeWidth, color: 0x000000 });
      }
      d += dashLen;
      dash = !dash;
    }
  }
}
