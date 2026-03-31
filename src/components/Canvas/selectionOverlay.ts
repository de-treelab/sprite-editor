import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';
import { getSelectionBounds } from '../../tools/drawingUtils';

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
  const bounds = getSelectionBounds(mask, canvasWidth, canvasHeight);
  if (!bounds) return;

  const { minX, minY, maxX, maxY } = bounds;
  const dashLen = 4;
  const points: [number, number][] = [
    [minX, minY], [maxX + 1, minY], [maxX + 1, maxY + 1], [minX, maxY + 1], [minX, minY],
  ];

  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / len;
    const ny = dy / len;
    let d = 0;
    let dash = true;
    let phase = marchingAntsOffset % (dashLen * 2);
    if (phase > dashLen) { dash = false; phase -= dashLen; }
    d = -phase;

    while (d < len) {
      const segStart = Math.max(0, d);
      const segEnd = Math.min(len, d + dashLen);
      if (segEnd > segStart && dash) {
        selectionGraphics.moveTo(ax + nx * segStart, ay + ny * segStart);
        selectionGraphics.lineTo(ax + nx * segEnd, ay + ny * segEnd);
        selectionGraphics.stroke({ width: 1 / (viewport.scale.x || 1), color: 0x000000 });
      }
      d += dashLen;
      dash = !dash;
    }
  }
}
