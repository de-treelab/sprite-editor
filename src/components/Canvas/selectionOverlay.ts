import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';

/**
 * Draw marching ants along the actual boundary of the selection mask.
 * For each selected pixel, we check its 4 neighbors — any edge bordering
 * a non-selected pixel (or the canvas edge) gets a dashed line segment.
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
  if (!mask) return;

  const strokeWidth = 1 / (viewport.scale.x || 1);
  const dashLen = 4 / (viewport.scale.x || 1);

  // Collect all boundary edge segments
  // Each segment is a horizontal or vertical line on the pixel grid
  const segments: [number, number, number, number][] = [];

  for (let y = 0; y < canvasHeight; y++) {
    for (let x = 0; x < canvasWidth; x++) {
      if (!mask[y * canvasWidth + x]) continue;

      // Top edge: if y === 0 or pixel above is not selected
      if (y === 0 || !mask[(y - 1) * canvasWidth + x]) {
        segments.push([x, y, x + 1, y]);
      }
      // Bottom edge
      if (y === canvasHeight - 1 || !mask[(y + 1) * canvasWidth + x]) {
        segments.push([x, y + 1, x + 1, y + 1]);
      }
      // Left edge
      if (x === 0 || !mask[y * canvasWidth + (x - 1)]) {
        segments.push([x, y, x, y + 1]);
      }
      // Right edge
      if (x === canvasWidth - 1 || !mask[y * canvasWidth + (x + 1)]) {
        segments.push([x + 1, y, x + 1, y + 1]);
      }
    }
  }

  if (segments.length === 0) return;

  // Draw each segment as a dashed line with marching ants
  for (const [ax, ay, bx, by] of segments) {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;
    const nx = dx / len;
    const ny = dy / len;

    let d = 0;
    let dash = true;
    let phase = (marchingAntsOffset / (viewport.scale.x || 1)) % (dashLen * 2);
    if (phase > dashLen) { dash = false; phase -= dashLen; }
    d = -phase;

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
