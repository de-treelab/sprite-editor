import { MaxRectsPacker } from 'maxrects-packer';
import type { AppProject, Spritesheet, Animation, SpriteFrame } from '../types/project';
import { exportWriteBytes, exportGif } from './backend';

// ── Types ──

export interface AtlasRect {
  frameId: string;
  frameName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AtlasResult {
  /** The atlas image as a PNG data URL */
  pngDataUrl: string;
  /** Width of the atlas texture */
  atlasWidth: number;
  /** Height of the atlas texture */
  atlasHeight: number;
  /** Rectangles for each frame within the atlas */
  rects: AtlasRect[];
}

export interface AnimationExportData {
  name: string;
  keyframes: { frameId: string; time: number; duration: number }[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface AtlasMetadata {
  atlasWidth: number;
  atlasHeight: number;
  frames: AtlasRect[];
  animations: AnimationExportData[];
}

// ── Frame compositing ──

/**
 * Composite all visible layers of a frame into a single canvas.
 * Returns a canvas with the composited result.
 */
export function compositeFrame(
  frame: SpriteFrame,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Draw layers bottom-to-top
  for (const layer of frame.layers) {
    if (!layer.visible || layer.isReference || !layer.data) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = blendModeToComposite(layer.blendMode);

    const img = new Image();
    img.src = layer.data;
    // Data URLs from canvas.toDataURL() are loaded synchronously when assigned to an Image
    // from the same origin. We draw immediately — if the image isn't ready, we skip.
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0);
    }
    ctx.restore();
  }

  return canvas;
}

/**
 * Async version that waits for all layer images to load.
 */
export async function compositeFrameAsync(
  frame: SpriteFrame,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (const layer of frame.layers) {
    if (!layer.visible || layer.isReference || !layer.data) continue;

    const img = await loadImage(layer.data);

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = blendModeToComposite(layer.blendMode);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function blendModeToComposite(mode: string): GlobalCompositeOperation {
  switch (mode) {
    case 'multiply': return 'multiply';
    case 'screen': return 'screen';
    case 'overlay': return 'overlay';
    default: return 'source-over';
  }
}

// ── Atlas packing ──

export interface AtlasOptions {
  maxWidth: number;
  maxHeight: number;
  padding: number;
  scale: number;
}

const DEFAULT_ATLAS_OPTIONS: AtlasOptions = {
  maxWidth: 4096,
  maxHeight: 4096,
  padding: 1,
  scale: 1,
};

/**
 * Pack all unique frames of a spritesheet into a texture atlas.
 */
export async function packAtlas(
  project: AppProject,
  spritesheet: Spritesheet,
  options: Partial<AtlasOptions> = {},
): Promise<AtlasResult> {
  const opts = { ...DEFAULT_ATLAS_OPTIONS, ...options };
  const defaultCanvas = project.defaultCanvasSize;

  // Determine unique frames used by any animation
  const usedFrameIds = new Set<string>();
  for (const anim of spritesheet.animations) {
    for (const kf of anim.keyframes) {
      usedFrameIds.add(kf.frameId);
    }
  }

  // Composite each unique frame
  const frameCanvases = new Map<string, HTMLCanvasElement>();
  for (const frame of spritesheet.frames) {
    if (!usedFrameIds.has(frame.id)) continue;
    // Find any animation using this frame to get canvas size
    const anim = spritesheet.animations.find(a =>
      a.keyframes.some(k => k.frameId === frame.id)
    );
    const cs = anim?.canvasSize ?? defaultCanvas;
    const w = Math.round(cs.width * opts.scale);
    const h = Math.round(cs.height * opts.scale);
    const canvas = await compositeFrameAsync(frame, w, h);
    frameCanvases.set(frame.id, canvas);
  }

  // Pack using maxrects-packer
  const packer = new MaxRectsPacker(opts.maxWidth, opts.maxHeight, opts.padding, {
    smart: true,
    pot: false,
    square: false,
  });

  const inputs = Array.from(frameCanvases.entries()).map(([id, canvas]) => ({
    width: canvas.width,
    height: canvas.height,
    data: { frameId: id },
  }));

  packer.addArray(inputs as any);

  if (packer.bins.length === 0) {
    throw new Error('Atlas packing failed: no bins produced');
  }

  // Use the first bin (single atlas)
  const bin = packer.bins[0];

  // Create atlas canvas
  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = bin.width;
  atlasCanvas.height = bin.height;
  const atlasCtx = atlasCanvas.getContext('2d')!;

  const rects: AtlasRect[] = [];

  for (const rect of bin.rects) {
    const frameId = (rect as any).data?.frameId;
    if (!frameId) continue;
    const frameCanvas = frameCanvases.get(frameId);
    if (!frameCanvas) continue;

    atlasCtx.drawImage(frameCanvas, rect.x, rect.y);

    // Find a name for the frame
    const frameIndex = spritesheet.frames.findIndex(f => f.id === frameId);
    const frameName = `frame_${frameIndex}`;

    rects.push({
      frameId,
      frameName,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    });
  }

  return {
    pngDataUrl: atlasCanvas.toDataURL('image/png'),
    atlasWidth: bin.width,
    atlasHeight: bin.height,
    rects,
  };
}

// ── Build animation export data ──

export function buildAnimationExportData(
  animations: Animation[],
  defaultCanvasSize: { width: number; height: number },
): AnimationExportData[] {
  return animations.map(anim => {
    const sorted = [...anim.keyframes].sort((a, b) => a.time - b.time);
    const cs = anim.canvasSize ?? defaultCanvasSize;
    const keyframes = sorted.map((kf, idx) => {
      const nextTime = idx < sorted.length - 1 ? sorted[idx + 1].time : sorted[sorted.length - 1].time + 100;
      return {
        frameId: kf.frameId,
        time: kf.time,
        duration: nextTime - kf.time,
      };
    });
    return {
      name: anim.name,
      keyframes,
      canvasWidth: cs.width,
      canvasHeight: cs.height,
    };
  });
}

// ── Build metadata object ──

export function buildAtlasMetadata(
  atlas: AtlasResult,
  animations: AnimationExportData[],
): AtlasMetadata {
  return {
    atlasWidth: atlas.atlasWidth,
    atlasHeight: atlas.atlasHeight,
    frames: atlas.rects,
    animations,
  };
}

// ── Save atlas PNG to disk ──

export async function saveAtlasPng(path: string, atlas: AtlasResult): Promise<void> {
  // Extract base64 from data URL
  const b64 = atlas.pngDataUrl.split(',')[1];
  await exportWriteBytes(path, b64);
}

// ── Save metadata string to disk ──

export async function saveMetadataFile(path: string, content: string): Promise<void> {
  // Convert text content to base64
  const bytes = new TextEncoder().encode(content);
  const b64 = btoa(String.fromCharCode(...bytes));
  await exportWriteBytes(path, b64);
}

// ── GIF export ──

export interface GifOptions {
  scale: number;
}

/**
 * Export an animation as an animated GIF.
 * Composites frames, builds RGBA data, and sends to Rust for GIF encoding.
 */
export async function exportAnimationGif(
  path: string,
  project: AppProject,
  spritesheet: Spritesheet,
  animation: Animation,
  options: Partial<GifOptions> = {},
): Promise<void> {
  const scale = options.scale ?? 1;
  const cs = animation.canvasSize ?? project.defaultCanvasSize;
  const w = Math.round(cs.width * scale);
  const h = Math.round(cs.height * scale);

  const sorted = [...animation.keyframes].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) {
    throw new Error('Animation has no keyframes');
  }

  const gifFrames: { rgba_base64: string; width: number; height: number; delay_ms: number }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const kf = sorted[i];
    const frame = spritesheet.frames.find(f => f.id === kf.frameId);
    if (!frame) continue;

    const canvas = await compositeFrameAsync(frame, w, h);
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, w, h);

    // Convert Uint8ClampedArray to base64
    const rgbaB64 = uint8ArrayToBase64(imageData.data);

    // Compute duration until next keyframe
    const nextTime = i < sorted.length - 1 ? sorted[i + 1].time : sorted[sorted.length - 1].time + 100;
    const delayMs = Math.max(10, nextTime - kf.time);

    gifFrames.push({
      rgba_base64: rgbaB64,
      width: w,
      height: h,
      delay_ms: delayMs,
    });
  }

  await exportGif(path, JSON.stringify(gifFrames));
}

function uint8ArrayToBase64(data: Uint8Array | Uint8ClampedArray): string {
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
