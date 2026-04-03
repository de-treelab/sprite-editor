import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';
import { drawSelectionOverlay } from './selectionOverlay';

/**
 * Create the viewport container with checkerboard background, grid overlay,
 * selection overlay, drawing canvas/texture, and shape-preview layer.
 *
 * Returns all the created objects so they can be wired into the editor context.
 */
export function setupViewport(app: PIXI.Application, canvasWidth: number, canvasHeight: number) {
  const viewport = new PIXI.Container();
  const currentZoom = useEditorStore.getState().zoomLevel / 10;
  viewport.scale.set(currentZoom);

  // ── Checkerboard background ──
  const checkerCanvas = document.createElement('canvas');
  checkerCanvas.width = 2;
  checkerCanvas.height = 2;
  const checkerCtx = checkerCanvas.getContext('2d')!;
  checkerCtx.fillStyle = '#cccccc';
  checkerCtx.fillRect(0, 0, 1, 1);
  checkerCtx.fillRect(1, 1, 1, 1);
  checkerCtx.fillStyle = '#999999';
  checkerCtx.fillRect(1, 0, 1, 1);
  checkerCtx.fillRect(0, 1, 1, 1);
  const checkerTexture = PIXI.Texture.from(checkerCanvas);
  checkerTexture.source.scaleMode = 'nearest';
  const checkerboard = new PIXI.TilingSprite({
    texture: checkerTexture,
    width: canvasWidth,
    height: canvasHeight,
  });
  viewport.addChild(checkerboard);

  // ── Layer container ──
  const layerContainer = new PIXI.Container();
  layerContainer.sortableChildren = true;
  viewport.addChild(layerContainer);

  // ── Grid overlay ──
  const gridGraphics = new PIXI.Graphics();
  gridGraphics.zIndex = 9998;
  viewport.addChild(gridGraphics);

  const redrawGrid = () => {
    gridGraphics.clear();
    const edS = useEditorStore.getState();
    const zoom = viewport.scale.x;

    const minScreenPx = 4;
    const tileScale = Math.max(1, Math.ceil(minScreenPx / zoom));
    checkerboard.tileScale.set(tileScale, tileScale);

    if (edS.showGrid && zoom >= 8) {
      for (let x = 0; x <= canvasWidth; x++) {
        gridGraphics.moveTo(x, 0);
        gridGraphics.lineTo(x, canvasHeight);
      }
      for (let y = 0; y <= canvasHeight; y++) {
        gridGraphics.moveTo(0, y);
        gridGraphics.lineTo(canvasWidth, y);
      }
      gridGraphics.stroke({ width: 1 / zoom, color: 0x000000, alpha: 0.15 });
    }

    if (edS.showCenterLines) {
      const cx = canvasWidth / 2;
      const cy = canvasHeight / 2;
      gridGraphics.moveTo(cx, 0);
      gridGraphics.lineTo(cx, canvasHeight);
      gridGraphics.moveTo(0, cy);
      gridGraphics.lineTo(canvasWidth, cy);
      gridGraphics.stroke({ width: 1 / zoom, color: 0x00ccff, alpha: 0.5 });
    }
  };

  // ── Selection overlay ──
  const selectionGraphics = new PIXI.Graphics();
  selectionGraphics.zIndex = 9999;
  viewport.addChild(selectionGraphics);

  let marchingAntsOffset = 0;
  const redrawSelection = () => {
    drawSelectionOverlay(selectionGraphics, viewport, canvasWidth, canvasHeight, marchingAntsOffset);
  };
  const marchingAntsTimer = setInterval(() => {
    marchingAntsOffset = (marchingAntsOffset + 1) % 100;
    redrawSelection();
  }, 150);

  // ── Drawing canvas + texture ──
  const drawingCanvas = document.createElement('canvas');
  drawingCanvas.width = canvasWidth;
  drawingCanvas.height = canvasHeight;
  const ctx = drawingCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const drawingTexture = PIXI.Texture.from(drawingCanvas);
  drawingTexture.source.scaleMode = 'nearest';

  // ── Preview canvas for shape/transform tools ──
  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = canvasWidth;
  previewCanvas.height = canvasHeight;
  const previewCtx = previewCanvas.getContext('2d')!;
  const previewTexture = PIXI.Texture.from(previewCanvas);
  previewTexture.source.scaleMode = 'nearest';
  const previewSprite = new PIXI.Sprite(previewTexture);
  previewSprite.zIndex = 99999;
  previewSprite.visible = false;
  viewport.addChild(previewSprite);

  app.stage.addChild(viewport);
  app.stage.eventMode = 'static';
  app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

  return {
    viewport,
    layerContainer,
    checkerboard,
    gridGraphics,
    selectionGraphics,
    drawingCanvas,
    ctx,
    drawingTexture,
    previewCanvas,
    previewCtx,
    previewTexture,
    previewSprite,
    redrawGrid,
    redrawSelection,
    marchingAntsTimer,
    currentZoom,
  };
}
