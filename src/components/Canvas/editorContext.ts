import * as PIXI from 'pixi.js';

/**
 * Shared context object passed between the setup modules that together
 * comprise the PixiEditor runtime.  Created once per editor mount.
 */
export interface PixiEditorContext {
  app: PIXI.Application;
  viewport: PIXI.Container;
  containerRef: React.RefObject<HTMLDivElement | null>;
  appRef: React.MutableRefObject<PIXI.Application | null>;

  canvasWidth: number;
  canvasHeight: number;

  // Drawing surface
  drawingCanvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawingTexture: PIXI.Texture;

  // Shape/transform preview layer
  previewCanvas: HTMLCanvasElement;
  previewCtx: CanvasRenderingContext2D;
  previewTexture: PIXI.Texture;
  previewSprite: PIXI.Sprite;

  // Overlays
  selectionGraphics: PIXI.Graphics;
  checkerboard: PIXI.TilingSprite;

  // Callbacks populated during setup
  redrawGrid: () => void;
  redrawSelection: () => void;
  doSyncLayers: () => void;

  // Mutable interaction state (shared between pointer handlers)
  interaction: {
    isDrawing: boolean;
    isPanning: boolean;
    startPos: { x: number; y: number };
    lastDrawPos: { x: number; y: number };
    lastPanPos: { x: number; y: number };
    snapshotBeforeDraw: ImageData | null;
    isSpaceHeld: boolean;
  };
}
