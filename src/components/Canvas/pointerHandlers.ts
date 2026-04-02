import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import {
  drawBrush,
  drawLine,
  drawRectangle,
  drawEllipse,
  floodFill,
  pickColor,
  flipHorizontal,
  flipVertical,
  rotateByArbitraryAngle,
  movePixels,
  scalePixels,
  createRectSelection,
  createEllipseSelection,
  createMagicWandSelection,
  combineSelections,
  isSelectionEmpty,
  BrushShape,
} from '../../tools/drawingUtils';
import { commitWithUndo, getToolProp } from './canvasUtils';
import { toolDefinitions, ToolId } from '../../tools/toolDefinitions';
import type { PixiEditorContext } from './editorContext';

/**
 * Attach pointer-event handlers (down / move / up) to the Pixi stage.
 */
export function setupPointerHandlers(ec: PixiEditorContext) {
  const {
    app, viewport, containerRef,
    ctx, drawingTexture, drawingCanvas,
    previewCanvas, previewCtx, previewTexture, previewSprite,
    selectionGraphics,
    canvasWidth, canvasHeight,
    interaction,
  } = ec;

  const getToolPropLocal = <T extends number | string | boolean>(tool: string, key: string, defaultVal: T): T =>
    getToolProp<T>(tool, key, defaultVal);

  const commitLocal = (label: string, beforeData: ImageData) => {
    commitWithUndo(label, beforeData, drawingCanvas, ctx, drawingTexture, canvasWidth, canvasHeight);
  };

  // ── Pointer Down ──

  app.stage.on('pointerdown', (e) => {
    const edState = useEditorStore.getState();
    const tool = edState.activeTool;

    // Middle mouse, Space held, or pan tool = viewport pan
    if (e.button === 1 || interaction.isSpaceHeld || tool === 'pan') {
      interaction.isPanning = true;
      interaction.lastPanPos = { x: e.global.x, y: e.global.y };
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      return;
    }

    // Check if we can draw on the active layer
    const pState = useProjectStore.getState();
    const frame = pState.project?.spritesheets
      .find(s => s.id === pState.activeSpritesheetId)
      ?.frames.find(f => f.id === pState.activeFrameId);
    const activeLayer = frame?.layers.find(l => l.id === pState.activeLayerId);

    if (!activeLayer || activeLayer.locked || activeLayer.visible === false) {
      return;
    }

    const localPos = viewport.toLocal(e.global);
    const px = Math.floor(localPos.x);
    const py = Math.floor(localPos.y);

    // Handle instant tools (click-only, no drag)
    if (tool === 'fill') {
      const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const tolerance = getToolPropLocal<number>('fill', 'tolerance', 0);
      const contiguous = getToolPropLocal<boolean>('fill', 'contiguous', true);
      floodFill(ctx, px, py, edState.primaryColor, tolerance, contiguous, canvasWidth, canvasHeight);
      drawingTexture.source.update();
      commitLocal('Fill', before);
      return;
    }

    if (tool === 'picker') {
      const color = pickColor(ctx, px, py, canvasWidth, canvasHeight);
      if (color) {
        edState.setPrimaryColor(color);
      }
      return;
    }

    if (tool === 'flipHorizontal') {
      const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const mask = useEditorStore.getState().selectionMask;
      flipHorizontal(ctx, canvasWidth, canvasHeight, mask);
      drawingTexture.source.update();
      commitLocal('Flip horizontal', before);
      return;
    }

    if (tool === 'flipVertical') {
      const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      const mask = useEditorStore.getState().selectionMask;
      flipVertical(ctx, canvasWidth, canvasHeight, mask);
      drawingTexture.source.update();
      commitLocal('Flip vertical', before);
      return;
    }

    if (tool === 'magicWand') {
      const tolerance = getToolPropLocal<number>('magicWand', 'tolerance', 15);
      const selectionMode = getToolPropLocal<string>('magicWand', 'selectionMode', 'replace') as 'replace' | 'add' | 'subtract' | 'intersect';
      const contiguous = getToolPropLocal<boolean>('magicWand', 'contiguous', true);
      const newMask = createMagicWandSelection(ctx, px, py, tolerance, contiguous, canvasWidth, canvasHeight);
      const combined = combineSelections(useEditorStore.getState().selectionMask, newMask, selectionMode);
      useEditorStore.getState().setSelectionMask(isSelectionEmpty(combined) ? null : combined);
      ec.redrawSelection();
      return;
    }

    // Start drawing for drag-based tools
    interaction.isDrawing = true;
    interaction.startPos = { x: px, y: py };
    interaction.lastDrawPos = { x: px, y: py };
    interaction.snapshotBeforeDraw = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    if (tool === 'pencil' || tool === 'eraser') {
      const brushSize = getToolPropLocal<number>(tool, 'brushSize', 1);
      const brushShape = getToolPropLocal<string>(tool, 'brushShape', 'square') as BrushShape;
      drawBrush(ctx, px, py, brushSize, brushShape, edState.primaryColor, tool === 'eraser');
      drawingTexture.source.update();
    }

    if (tool === 'move' || tool === 'transform') {
      if (containerRef.current) containerRef.current.style.cursor = 'move';
    }
    if (tool === 'scale') {
      if (containerRef.current) containerRef.current.style.cursor = 'nwse-resize';
    }
    if (tool === 'rotate') {
      if (containerRef.current) containerRef.current.style.cursor = 'crosshair';
    }
  });

  // ── Pointer Move ──

  app.stage.on('pointermove', (e) => {
    if (interaction.isPanning) {
      const dx = e.global.x - interaction.lastPanPos.x;
      const dy = e.global.y - interaction.lastPanPos.y;
      viewport.x += dx;
      viewport.y += dy;
      interaction.lastPanPos = { x: e.global.x, y: e.global.y };
      return;
    }

    if (!interaction.isDrawing) return;

    const localPos = viewport.toLocal(e.global);
    const px = Math.floor(localPos.x);
    const py = Math.floor(localPos.y);
    const edState = useEditorStore.getState();
    const tool = edState.activeTool;
    const { startPos, lastDrawPos, snapshotBeforeDraw } = interaction;

    if (tool === 'pencil' || tool === 'eraser') {
      const brushSize = getToolPropLocal<number>(tool, 'brushSize', 1);
      const brushShape = getToolPropLocal<string>(tool, 'brushShape', 'square') as BrushShape;

      const dx = Math.abs(px - lastDrawPos.x);
      const dy = Math.abs(py - lastDrawPos.y);
      const sx = lastDrawPos.x < px ? 1 : -1;
      const sy = lastDrawPos.y < py ? 1 : -1;
      let err = dx - dy;
      let x = lastDrawPos.x;
      let y = lastDrawPos.y;

      while (true) {
        drawBrush(ctx, x, y, brushSize, brushShape, edState.primaryColor, tool === 'eraser');
        if (x === px && y === py) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 < dx) { err += dx; y += sy; }
      }

      interaction.lastDrawPos = { x: px, y: py };
      drawingTexture.source.update();
    } else if (tool === 'move' || tool === 'transform') {
      if (snapshotBeforeDraw) {
        ctx.putImageData(snapshotBeforeDraw, 0, 0);
        const dx = px - startPos.x;
        const dy = py - startPos.y;
        const mask = edState.selectionMask;
        movePixels(ctx, canvasWidth, canvasHeight, dx, dy, mask);
        drawingTexture.source.update();
        interaction.lastDrawPos = { x: px, y: py };
      }
    } else if (tool === 'scale') {
      if (snapshotBeforeDraw) {
        ctx.putImageData(snapshotBeforeDraw, 0, 0);
        const dx = px - startPos.x;
        const dy = py - startPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const sign = (dx + dy) >= 0 ? 1 : -1;
        const scaleFactor = Math.max(0.1, 1 + sign * distance / 50);
        const maintainAspect = getToolPropLocal<boolean>('scale', 'maintainAspect', true);
        const interpolation = getToolPropLocal<string>('scale', 'interpolation', 'nearest') as 'nearest' | 'bilinear';
        const sx = scaleFactor;
        const sy = maintainAspect ? scaleFactor : Math.max(0.1, 1 + dy / 50);
        const mask = edState.selectionMask;
        scalePixels(ctx, canvasWidth, canvasHeight, sx, sy, interpolation, mask);
        drawingTexture.source.update();
        interaction.lastDrawPos = { x: px, y: py };
      }
    } else if (tool === 'rotate') {
      if (snapshotBeforeDraw) {
        ctx.putImageData(snapshotBeforeDraw, 0, 0);
        const dx = px - startPos.x;
        const angle = dx * 2;
        const interpolation = getToolPropLocal<string>('rotate', 'interpolation', 'nearest') as 'nearest' | 'bilinear';
        const mask = edState.selectionMask;
        rotateByArbitraryAngle(ctx, canvasWidth, canvasHeight, angle, interpolation, mask);
        drawingTexture.source.update();
        interaction.lastDrawPos = { x: px, y: py };
      }
    } else if (tool === 'line') {
      if (snapshotBeforeDraw) {
        previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        const thickness = getToolPropLocal<number>('line', 'brushSize', 1);
        drawLine(previewCtx, startPos.x, startPos.y, px, py, edState.primaryColor, thickness, 'square');
        previewTexture.source.update();
        previewSprite.visible = true;
      }
    } else if (tool === 'rectangle') {
      if (snapshotBeforeDraw) {
        previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        const filled = getToolPropLocal<boolean>('rectangle', 'filled', false);
        const strokeWidth = getToolPropLocal<number>('rectangle', 'brushSize', 1);
        drawRectangle(previewCtx, startPos.x, startPos.y, px, py, edState.primaryColor, filled, strokeWidth);
        previewTexture.source.update();
        previewSprite.visible = true;
      }
    } else if (tool === 'ellipse') {
      if (snapshotBeforeDraw) {
        previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        const filled = getToolPropLocal<boolean>('ellipse', 'filled', false);
        const strokeWidth = getToolPropLocal<number>('ellipse', 'brushSize', 1);
        drawEllipse(previewCtx, startPos.x, startPos.y, px, py, edState.primaryColor, filled, strokeWidth);
        previewTexture.source.update();
        previewSprite.visible = true;
      }
    } else if (tool === 'selection') {
      const selectionShape = getToolPropLocal<string>('selection', 'selectionShape', 'rectangle');
      selectionGraphics.clear();
      if (selectionShape === 'ellipse') {
        const cx = (startPos.x + px) / 2;
        const cy = (startPos.y + py) / 2;
        const rx = Math.abs(px - startPos.x) / 2;
        const ry = Math.abs(py - startPos.y) / 2;
        selectionGraphics.ellipse(cx, cy, rx, ry);
      } else {
        const rx = Math.min(startPos.x, px);
        const ry = Math.min(startPos.y, py);
        const rw = Math.abs(px - startPos.x);
        const rh = Math.abs(py - startPos.y);
        selectionGraphics.rect(rx, ry, rw, rh);
      }
      selectionGraphics.stroke({ width: 1 / (viewport.scale.x || 1), color: 0x000000, pixelLine: true });
      interaction.lastDrawPos = { x: px, y: py };
    }
  });

  // ── Pointer Up / Commit ──

  const PREVIEW_TOOLS = new Set(['line', 'rectangle', 'ellipse']);

  const commitDataFlow = () => {
    if (interaction.isDrawing) {
      interaction.isDrawing = false;
      const edState = useEditorStore.getState();
      const { startPos, lastDrawPos, snapshotBeforeDraw } = interaction;

      if (PREVIEW_TOOLS.has(edState.activeTool) && previewSprite.visible) {
        ctx.drawImage(previewCanvas, 0, 0);
        drawingTexture.source.update();
        previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        previewSprite.visible = false;
      }

      if (edState.activeTool === 'selection') {
        const selectionShape = getToolPropLocal<string>('selection', 'selectionShape', 'rectangle');
        const selectionMode = getToolPropLocal<string>('selection', 'selectionMode', 'replace') as 'replace' | 'add' | 'subtract' | 'intersect';
        const newMask = selectionShape === 'ellipse'
          ? createEllipseSelection(startPos.x, startPos.y, lastDrawPos.x, lastDrawPos.y, canvasWidth, canvasHeight)
          : createRectSelection(startPos.x, startPos.y, lastDrawPos.x, lastDrawPos.y, canvasWidth, canvasHeight);
        const combined = combineSelections(edState.selectionMask, newMask, selectionMode);
        edState.setSelectionMask(isSelectionEmpty(combined) ? null : combined);
        ec.redrawSelection();
      } else if (edState.activeTool === 'move' || edState.activeTool === 'scale' || edState.activeTool === 'rotate' || edState.activeTool === 'transform') {
        if (snapshotBeforeDraw) {
          const toolName = edState.activeTool;
          commitLocal(toolName.charAt(0).toUpperCase() + toolName.slice(1), snapshotBeforeDraw);
        }
      } else if (snapshotBeforeDraw) {
        const toolName = edState.activeTool;
        commitLocal(toolName.charAt(0).toUpperCase() + toolName.slice(1), snapshotBeforeDraw);
      }
    }
    interaction.isPanning = false;
    if (containerRef.current && !interaction.isSpaceHeld) {
      const tool = useEditorStore.getState().activeTool as ToolId;
      containerRef.current.style.cursor = toolDefinitions[tool]?.cursor || '';
    }
  };

  app.stage.on('pointerup', commitDataFlow);
  app.stage.on('pointerupoutside', commitDataFlow);
}
