/**
 * Drawing utility functions for canvas-based tools
 */

export type BrushShape = 'square' | 'circle';

/**
 * Draw a brush stroke at a point with given size and shape
 */
export const drawBrush = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: BrushShape,
  color: string,
  isEraser: boolean
) => {
  const half = Math.floor(size / 2);

  if (isEraser) {
    if (shape === 'circle') {
      drawFilledCircle(ctx, x, y, half, '', true);
    } else {
      ctx.clearRect(x - half, y - half, size, size);
    }
  } else {
    ctx.fillStyle = color;
    if (shape === 'circle') {
      drawFilledCircle(ctx, x, y, half, color, false);
    } else {
      ctx.fillRect(x - half, y - half, size, size);
    }
  }
};

/**
 * Draw a filled circle using midpoint algorithm (pixel perfect)
 */
const drawFilledCircle = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  _color: string,
  isEraser: boolean
) => {
  if (radius <= 0) {
    if (isEraser) {
      ctx.clearRect(cx, cy, 1, 1);
    } else {
      ctx.fillRect(cx, cy, 1, 1);
    }
    return;
  }

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        if (isEraser) {
          ctx.clearRect(cx + x, cy + y, 1, 1);
        } else {
          ctx.fillRect(cx + x, cy + y, 1, 1);
        }
      }
    }
  }
};

/**
 * Bresenham line algorithm with thickness support
 */
export const drawLine = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  thickness: number,
  brushShape: BrushShape
) => {
  ctx.fillStyle = color;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    drawBrush(ctx, x0, y0, thickness, brushShape, color, false);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
};

/**
 * Draw a rectangle (filled or stroke only)
 */
export const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  filled: boolean,
  strokeWidth: number
) => {
  ctx.fillStyle = color;

  const minX = Math.min(x0, x1);
  const minY = Math.min(y0, y1);
  const maxX = Math.max(x0, x1);
  const maxY = Math.max(y0, y1);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  if (filled) {
    ctx.fillRect(minX, minY, width, height);
  } else {
    // Draw stroke rectangle using lines for pixel-perfect rendering
    const half = Math.floor(strokeWidth / 2);

    // Top edge
    for (let sw = 0; sw < strokeWidth; sw++) {
      for (let x = minX; x <= maxX; x++) {
        ctx.fillRect(x, minY - half + sw, 1, 1);
      }
    }
    // Bottom edge
    for (let sw = 0; sw < strokeWidth; sw++) {
      for (let x = minX; x <= maxX; x++) {
        ctx.fillRect(x, maxY - half + sw, 1, 1);
      }
    }
    // Left edge
    for (let sw = 0; sw < strokeWidth; sw++) {
      for (let y = minY; y <= maxY; y++) {
        ctx.fillRect(minX - half + sw, y, 1, 1);
      }
    }
    // Right edge
    for (let sw = 0; sw < strokeWidth; sw++) {
      for (let y = minY; y <= maxY; y++) {
        ctx.fillRect(maxX - half + sw, y, 1, 1);
      }
    }
  }
};

/**
 * Draw an ellipse (filled or stroke only) using midpoint algorithm
 */
export const drawEllipse = (
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: string,
  filled: boolean,
  strokeWidth: number
) => {
  ctx.fillStyle = color;

  const cx = Math.floor((x0 + x1) / 2);
  const cy = Math.floor((y0 + y1) / 2);
  const rx = Math.abs(Math.floor((x1 - x0) / 2));
  const ry = Math.abs(Math.floor((y1 - y0) / 2));

  if (rx === 0 && ry === 0) {
    ctx.fillRect(cx, cy, 1, 1);
    return;
  }

  if (filled) {
    // Filled ellipse
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if (rx > 0 && ry > 0) {
          if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
            ctx.fillRect(cx + x, cy + y, 1, 1);
          }
        } else if (rx === 0) {
          ctx.fillRect(cx, cy + y, 1, 1);
        } else {
          ctx.fillRect(cx + x, cy, 1, 1);
        }
      }
    }
  } else {
    // Stroke ellipse - draw outline only
    const half = Math.floor(strokeWidth / 2);

    for (let y = -ry - half; y <= ry + half; y++) {
      for (let x = -rx - half; x <= rx + half; x++) {
        if (rx > 0 && ry > 0) {
          const outerRx = rx + half;
          const outerRy = ry + half;
          const innerRx = Math.max(0, rx - half - 1);
          const innerRy = Math.max(0, ry - half - 1);

          const outerDist = (x * x) / (outerRx * outerRx) + (y * y) / (outerRy * outerRy);
          const innerDist = innerRx > 0 && innerRy > 0
            ? (x * x) / (innerRx * innerRx) + (y * y) / (innerRy * innerRy)
            : 2; // Force inclusion if inner radius is 0

          if (outerDist <= 1 && innerDist > 1) {
            ctx.fillRect(cx + x, cy + y, 1, 1);
          }
        }
      }
    }
  }
};

/**
 * Flood fill with tolerance
 */
export const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string,
  tolerance: number,
  contiguous: boolean,
  canvasWidth: number,
  canvasHeight: number
) => {
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  // Parse fill color
  const fillRgb = hexToRgb(fillColor);
  if (!fillRgb) return;

  // Get target color at start position
  const startIdx = (startY * canvasWidth + startX) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Don't fill if clicking on the same color (including alpha)
  if (
    Math.abs(fillRgb.r - targetR) <= tolerance &&
    Math.abs(fillRgb.g - targetG) <= tolerance &&
    Math.abs(fillRgb.b - targetB) <= tolerance &&
    Math.abs(255 - targetA) <= tolerance
  ) {
    return;
  }

  const matchesTarget = (idx: number): boolean => {
    return (
      Math.abs(data[idx] - targetR) <= tolerance &&
      Math.abs(data[idx + 1] - targetG) <= tolerance &&
      Math.abs(data[idx + 2] - targetB) <= tolerance &&
      Math.abs(data[idx + 3] - targetA) <= tolerance
    );
  };

  const setPixel = (idx: number) => {
    data[idx] = fillRgb.r;
    data[idx + 1] = fillRgb.g;
    data[idx + 2] = fillRgb.b;
    data[idx + 3] = 255;
  };

  if (contiguous) {
    // Standard flood fill using scanline algorithm
    const visited = new Uint8Array(canvasWidth * canvasHeight);
    const stack: [number, number][] = [[startX, startY]];

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;

      if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;

      const pixelIdx = y * canvasWidth + x;
      if (visited[pixelIdx]) continue;

      const idx = pixelIdx * 4;
      if (!matchesTarget(idx)) continue;

      visited[pixelIdx] = 1;
      setPixel(idx);

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  } else {
    // Non-contiguous: replace all pixels matching target color
    for (let i = 0; i < data.length; i += 4) {
      if (matchesTarget(i)) {
        setPixel(i);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Pick color from canvas at position
 */
export const pickColor = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  _sampleMerged: boolean = false
): string | null => {
  if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) return null;

  const imageData = ctx.getImageData(x, y, 1, 1);
  const [r, g, b, a] = imageData.data;

  if (a === 0) return null;

  return rgbToHex(r, g, b);
};

/**
 * Flip canvas horizontally.
 * If a selectionMask is provided, only the selected pixels are flipped
 * within the bounding box of the selection.
 */
export const flipHorizontal = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  selectionMask?: Uint8Array | null,
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (selectionMask && selectionMask.length === width * height) {
    const bounds = getSelectionBounds(selectionMask, width, height);
    if (!bounds) return; // empty selection, nothing to flip

    const { minX, maxX, minY, maxY } = bounds;
    const bw = maxX - minX + 1;

    for (let y = minY; y <= maxY; y++) {
      for (let dx = 0; dx < Math.floor(bw / 2); dx++) {
        const lx = minX + dx;
        const rx = maxX - dx;
        const leftSel = selectionMask[y * width + lx];
        const rightSel = selectionMask[y * width + rx];

        // Only swap if both pixels are in the selection
        if (leftSel && rightSel) {
          const li = (y * width + lx) * 4;
          const ri = (y * width + rx) * 4;
          for (let i = 0; i < 4; i++) {
            const tmp = data[li + i];
            data[li + i] = data[ri + i];
            data[ri + i] = tmp;
          }
        }
      }
    }
  } else {
    // Full canvas flip
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < Math.floor(width / 2); x++) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - 1 - x)) * 4;
        for (let i = 0; i < 4; i++) {
          const temp = data[leftIdx + i];
          data[leftIdx + i] = data[rightIdx + i];
          data[rightIdx + i] = temp;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Flip canvas vertically.
 * If a selectionMask is provided, only the selected pixels are flipped
 * within the bounding box of the selection.
 */
export const flipVertical = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  selectionMask?: Uint8Array | null,
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  if (selectionMask && selectionMask.length === width * height) {
    const bounds = getSelectionBounds(selectionMask, width, height);
    if (!bounds) return;

    const { minX, maxX, minY, maxY } = bounds;
    const bh = maxY - minY + 1;

    for (let dy = 0; dy < Math.floor(bh / 2); dy++) {
      const ty = minY + dy;
      const by = maxY - dy;
      for (let x = minX; x <= maxX; x++) {
        const topSel = selectionMask[ty * width + x];
        const botSel = selectionMask[by * width + x];

        if (topSel && botSel) {
          const ti = (ty * width + x) * 4;
          const bi = (by * width + x) * 4;
          for (let i = 0; i < 4; i++) {
            const tmp = data[ti + i];
            data[ti + i] = data[bi + i];
            data[bi + i] = tmp;
          }
        }
      }
    }
  } else {
    // Full canvas flip
    for (let y = 0; y < Math.floor(height / 2); y++) {
      for (let x = 0; x < width; x++) {
        const topIdx = (y * width + x) * 4;
        const bottomIdx = ((height - 1 - y) * width + x) * 4;
        for (let i = 0; i < 4; i++) {
          const temp = data[topIdx + i];
          data[topIdx + i] = data[bottomIdx + i];
          data[bottomIdx + i] = temp;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

// ───── Selection utilities ─────

/**
 * Compute the bounding box of all selected (non-zero) pixels in a mask.
 * Returns null if the selection is empty.
 */
export const getSelectionBounds = (
  mask: Uint8Array,
  width: number,
  height: number,
): { minX: number; minY: number; maxX: number; maxY: number } | null => {
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  return { minX, minY, maxX, maxY };
};

/**
 * Create a rectangular selection mask.
 */
export const createRectSelection = (
  x0: number, y0: number,
  x1: number, y1: number,
  width: number, height: number,
): Uint8Array => {
  const mask = new Uint8Array(width * height);
  const minX = Math.max(0, Math.min(x0, x1));
  const maxX = Math.min(width - 1, Math.max(x0, x1));
  const minY = Math.max(0, Math.min(y0, y1));
  const maxY = Math.min(height - 1, Math.max(y0, y1));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      mask[y * width + x] = 1;
    }
  }
  return mask;
};

/**
 * Create an elliptical selection mask.
 */
export const createEllipseSelection = (
  x0: number, y0: number,
  x1: number, y1: number,
  width: number, height: number,
): Uint8Array => {
  const mask = new Uint8Array(width * height);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;

  if (rx === 0 || ry === 0) return mask;

  const minY = Math.max(0, Math.floor(cy - ry));
  const maxY = Math.min(height - 1, Math.ceil(cy + ry));
  const minX = Math.max(0, Math.floor(cx - rx));
  const maxX = Math.min(width - 1, Math.ceil(cx + rx));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
        mask[y * width + x] = 1;
      }
    }
  }
  return mask;
};

/**
 * Magic wand selection — flood-fill selection at a point.
 */
export const createMagicWandSelection = (
  ctx: CanvasRenderingContext2D,
  startX: number, startY: number,
  tolerance: number,
  contiguous: boolean,
  width: number, height: number,
): Uint8Array => {
  const mask = new Uint8Array(width * height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const idx = (startY * width + startX) * 4;
  const tR = data[idx], tG = data[idx + 1], tB = data[idx + 2], tA = data[idx + 3];

  const matches = (i: number) =>
    Math.abs(data[i] - tR) <= tolerance &&
    Math.abs(data[i + 1] - tG) <= tolerance &&
    Math.abs(data[i + 2] - tB) <= tolerance &&
    Math.abs(data[i + 3] - tA) <= tolerance;

  if (contiguous) {
    const stack: [number, number][] = [[startX, startY]];
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const pi = y * width + x;
      if (mask[pi]) continue;
      if (!matches(pi * 4)) continue;
      mask[pi] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      if (matches(i * 4)) mask[i] = 1;
    }
  }

  return mask;
};

/**
 * Combine two selection masks using the given mode.
 */
export const combineSelections = (
  existing: Uint8Array | null,
  incoming: Uint8Array,
  mode: 'replace' | 'add' | 'subtract' | 'intersect',
): Uint8Array => {
  if (!existing || mode === 'replace') return incoming;

  const result = new Uint8Array(incoming.length);
  for (let i = 0; i < incoming.length; i++) {
    switch (mode) {
      case 'add':
        result[i] = existing[i] || incoming[i] ? 1 : 0;
        break;
      case 'subtract':
        result[i] = existing[i] && !incoming[i] ? 1 : 0;
        break;
      case 'intersect':
        result[i] = existing[i] && incoming[i] ? 1 : 0;
        break;
    }
  }
  return result;
};

/**
 * Check if a selection mask has any selected pixels.
 */
export const isSelectionEmpty = (mask: Uint8Array | null): boolean => {
  if (!mask) return true;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) return false;
  }
  return true;
};

// Helper functions
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

/**
 * Rotate canvas pixels by 90° clockwise.
 * If a canvasSize-preserving mode is needed (different w/h), the caller
 * must handle resizing. This function works in-place for square canvases
 * or crops/pads as needed for non-square ones.
 * For selection-only rotation, operates within selection bounds.
 */
export const rotateCw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  selectionMask?: Uint8Array | null,
) => {
  rotateByDegrees(ctx, width, height, 90, selectionMask);
};

/**
 * Rotate canvas pixels by 90° counter-clockwise.
 */
export const rotateCcw = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  selectionMask?: Uint8Array | null,
) => {
  rotateByDegrees(ctx, width, height, 270, selectionMask);
};

/**
 * Rotate pixels by the given angle (90, 180, 270) within the selection
 * bounding box or the full canvas.
 */
const rotateByDegrees = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  degrees: 90 | 180 | 270,
  selectionMask?: Uint8Array | null,
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(imageData.data);

  let minX = 0, minY = 0, maxX = width - 1, maxY = height - 1;
  let useSelection = false;

  if (selectionMask && selectionMask.length === width * height) {
    const bounds = getSelectionBounds(selectionMask, width, height);
    if (!bounds) return;
    minX = bounds.minX;
    minY = bounds.minY;
    maxX = bounds.maxX;
    maxY = bounds.maxY;
    useSelection = true;
  }

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;

  // Extract source pixels from the bounding box
  const extractW = bw;
  const extractH = bh;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (useSelection && !selectionMask![y * width + x]) continue;

      const srcIdx = (y * width + x) * 4;
      const lx = x - minX;
      const ly = y - minY;

      let dx: number, dy: number;
      if (degrees === 90) {
        dx = (extractH - 1 - ly);
        dy = lx;
      } else if (degrees === 180) {
        dx = (extractW - 1 - lx);
        dy = (extractH - 1 - ly);
      } else { // 270
        dx = ly;
        dy = (extractW - 1 - lx);
      }

      // Map back to canvas coordinates, centering if dimensions change
      const targetW = (degrees === 90 || degrees === 270) ? extractH : extractW;
      const targetH = (degrees === 90 || degrees === 270) ? extractW : extractH;
      const offsetX = minX + Math.floor((bw - targetW) / 2);
      const offsetY = minY + Math.floor((bh - targetH) / 2);

      const tx = offsetX + dx;
      const ty = offsetY + dy;

      if (tx >= 0 && tx < width && ty >= 0 && ty < height) {
        const dstIdx = (ty * width + tx) * 4;
        imageData.data[dstIdx] = src[srcIdx];
        imageData.data[dstIdx + 1] = src[srcIdx + 1];
        imageData.data[dstIdx + 2] = src[srcIdx + 2];
        imageData.data[dstIdx + 3] = src[srcIdx + 3];
      }
    }
  }

  // Clear original pixels that are not in the rotated area (for selection rotation)
  if (useSelection) {
    const targetW = (degrees === 90 || degrees === 270) ? extractH : extractW;
    const targetH = (degrees === 90 || degrees === 270) ? extractW : extractH;
    const offsetX = minX + Math.floor((bw - targetW) / 2);
    const offsetY = minY + Math.floor((bh - targetH) / 2);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!selectionMask![y * width + x]) continue;
        // If this pixel is not within the target rectangle, clear it
        if (x < offsetX || x >= offsetX + targetW || y < offsetY || y >= offsetY + targetH) {
          const idx = (y * width + x) * 4;
          imageData.data[idx] = 0;
          imageData.data[idx + 1] = 0;
          imageData.data[idx + 2] = 0;
          imageData.data[idx + 3] = 0;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
};
