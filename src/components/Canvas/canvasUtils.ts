import { useProjectStore } from '../../store/projectStore';
import { useHistoryStore } from '../../store/historyStore';

export const CANVAS_MIN_ZOOM = 2;
export const CANVAS_MAX_ZOOM = 10000;

export function imageDataToDataURL(imageData: ImageData, w: number, h: number): string {
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  tmp.getContext('2d')!.putImageData(imageData, 0, 0);
  return tmp.toDataURL();
}

export function restoreImageToCanvas(
  dataURL: string,
  ctx: CanvasRenderingContext2D,
  drawingTexture: { source: { update: () => void } },
  canvasWidth: number,
  canvasHeight: number,
) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0);
    drawingTexture.source.update();
  };
  img.src = dataURL;
}

/**
 * Compute the bounding box of pixels that differ between two ImageData buffers.
 * Returns null if they are identical.
 */
function computeDirtyBounds(
  before: ImageData,
  after: ImageData,
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number } | null {
  let minX = width,
    minY = height,
    maxX = -1,
    maxY = -1;
  const bd = before.data;
  const ad = after.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (bd[i] !== ad[i] || bd[i + 1] !== ad[i + 1] || bd[i + 2] !== ad[i + 2] || bd[i + 3] !== ad[i + 3]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Extract a cropped region of raw RGBA pixels from an ImageData buffer.
 */
function cropRegion(
  imageData: ImageData,
  fullWidth: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rw * rh * 4);
  const src = imageData.data;
  for (let y = 0; y < rh; y++) {
    const srcOff = ((ry + y) * fullWidth + rx) * 4;
    const dstOff = y * rw * 4;
    out.set(src.subarray(srcOff, srcOff + rw * 4), dstOff);
  }
  return out;
}

/**
 * Apply a cropped RGBA region back onto a canvas context.
 */
function applyCrop(
  ctx: CanvasRenderingContext2D,
  pixels: Uint8ClampedArray,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  const patch = new ImageData(pixels, rw, rh);
  ctx.putImageData(patch, rx, ry);
}

export function commitWithUndo(
  label: string,
  beforeData: ImageData,
  drawingCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  drawingTexture: { source: { update: () => void } },
  canvasWidth: number,
  canvasHeight: number,
) {
  const pState = useProjectStore.getState();
  const sheetId = pState.activeSpritesheetId;
  const frameId = pState.activeFrameId;
  const layerId = pState.activeLayerId;
  if (!sheetId || !frameId || !layerId) return;

  const afterData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const bounds = computeDirtyBounds(beforeData, afterData, canvasWidth, canvasHeight);

  // Full data URL is still needed for the project store (persistence)
  const afterURL = drawingCanvas.toDataURL();
  useProjectStore.getState().updateLayer(sheetId, frameId, layerId, { data: afterURL });

  if (!bounds) {
    // No pixels changed — nothing to undo
    return;
  }

  // Store only the changed region for undo/redo (much smaller than full data URLs)
  const beforeCrop = cropRegion(beforeData, canvasWidth, bounds.x, bounds.y, bounds.w, bounds.h);
  const afterCrop = cropRegion(afterData, canvasWidth, bounds.x, bounds.y, bounds.w, bounds.h);
  const { x: bx, y: by, w: bw, h: bh } = bounds;

  // We still need the full data URLs for the project store, but we generate
  // them lazily only when undo/redo needs to persist.
  // Keep a reference to the before URL only — the after URL is already stored above.
  let lazyBeforeURL: string | null = null;

  const getBeforeURL = () => {
    if (!lazyBeforeURL) {
      // Reconstruct: take current canvas, apply before-crop, serialize
      const tmp = document.createElement('canvas');
      tmp.width = canvasWidth;
      tmp.height = canvasHeight;
      const tCtx = tmp.getContext('2d')!;
      // Start from afterData and apply the before-crop patch
      tCtx.putImageData(afterData, 0, 0);
      applyCrop(tCtx, beforeCrop, bx, by, bw, bh);
      lazyBeforeURL = tmp.toDataURL();
    }
    return lazyBeforeURL;
  };

  useHistoryStore.getState().push({
    label,
    undo: () => {
      useProjectStore.getState().updateLayer(sheetId, frameId, layerId, { data: getBeforeURL() });
      const cur = useProjectStore.getState();
      if (cur.activeSpritesheetId === sheetId && cur.activeFrameId === frameId && cur.activeLayerId === layerId) {
        applyCrop(ctx, beforeCrop, bx, by, bw, bh);
        drawingTexture.source.update();
      }
    },
    redo: () => {
      useProjectStore.getState().updateLayer(sheetId, frameId, layerId, { data: afterURL });
      const cur = useProjectStore.getState();
      if (cur.activeSpritesheetId === sheetId && cur.activeFrameId === frameId && cur.activeLayerId === layerId) {
        applyCrop(ctx, afterCrop, bx, by, bw, bh);
        drawingTexture.source.update();
      }
    },
  });
}

export function getToolProp<T extends number | string | boolean>(tool: string, key: string, defaultVal: T): T {
  const edState = useEditorStore.getState();
  const props = edState.toolProperties[tool as keyof typeof edState.toolProperties];
  return (props?.[key] as T) ?? defaultVal;
}

// Need to import at top-level but avoid circular — import inline
import { useEditorStore } from '../../store/editorStore';
