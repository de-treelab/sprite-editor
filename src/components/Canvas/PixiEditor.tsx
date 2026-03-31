import { useRef, useEffect, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasCommands } from '../../hooks/useCanvasCommands';
import { setCanvasActions } from '../../hooks/canvasActions';
import {
  drawBrush,
  drawLine,
  drawRectangle,
  drawEllipse,
  floodFill,
  pickColor,
  flipHorizontal,
  flipVertical,
  rotateCw,
  rotateCcw,
  createRectSelection,
  createEllipseSelection,
  createMagicWandSelection,
  combineSelections,
  isSelectionEmpty,
  getSelectionBounds,
  BrushShape
} from '../../tools/drawingUtils';
import { syncLayers } from './layerSync';
import { drawSelectionOverlay } from './selectionOverlay';
import { commitWithUndo, imageDataToDataURL, getToolProp } from './canvasUtils';
import { useHistoryStore } from '../../store/historyStore';

export const PixiEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<PIXI.Container | null>(null);
  const setFocusedView = useEditorStore((state) => state.setFocusedView);

  // Register canvas-scoped commands
  useCanvasCommands();

  const project = useProjectStore(state => state.project);
  const activeSpritesheetId = useProjectStore(state => state.activeSpritesheetId);
  const activeAnimationId = useProjectStore(state => state.activeAnimationId);

  // Compute effective canvas size from animation or project default
  const effectiveCanvasSize = useMemo(() => {
    if (!project) return { width: 32, height: 32 };
    const sheet = project.spritesheets.find(s => s.id === activeSpritesheetId);
    const anim = sheet?.animations.find(a => a.id === activeAnimationId);
    return anim?.canvasSize || project.defaultCanvasSize;
  }, [project, activeSpritesheetId, activeAnimationId]);

  const canvasW = effectiveCanvasSize.width;
  const canvasH = effectiveCanvasSize.height;

  useEffect(() => {
    if (!containerRef.current || !project) return;

    let isCancelled = false;
    let marchingAntsTimerRef: ReturnType<typeof setInterval> | null = null;
    const app = new PIXI.Application();
    let unsubscribeProjectStore: () => void;
    let unsubscribeEditorStore: () => void;

    // Space key tracking for pan (hoisted for cleanup access)
    let isSpaceHeld = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && useEditorStore.getState().focusedView === 'canvas') {
        e.preventDefault();
        isSpaceHeld = true;
        if (containerRef.current) containerRef.current.style.cursor = 'grab';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceHeld = false;
        if (containerRef.current) containerRef.current.style.cursor = '';
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);


    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundColor: 0x1e293b,
        resolution: window.devicePixelRatio || 1,
      });

      if (isCancelled) {
        app.destroy(true, { children: true });
        return;
      }

      appRef.current = app;

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
        app.canvas.style.position = 'absolute';
        app.canvas.style.width = '100%';
        app.canvas.style.height = '100%';
      }

      const canvasWidth = canvasW;
      const canvasHeight = canvasH;

      const viewport = new PIXI.Container();
      viewportRef.current = viewport;
      const currentZoom = useEditorStore.getState().zoomLevel / 10;
      viewport.scale.set(currentZoom);

      const updateViewportPlacement = () => {
         if (containerRef.current) {
             const w = containerRef.current.clientWidth;
             const h = containerRef.current.clientHeight;
             const tw = w > 0 ? w : 800;
             const th = h > 0 ? h : 600;
             viewport.x = (tw / 2) - ((canvasWidth * currentZoom) / 2);
             viewport.y = (th / 2) - ((canvasHeight * currentZoom) / 2);
         }
      };

      updateViewportPlacement();
      window.addEventListener('resize', updateViewportPlacement);

      const cleanupResize = () => {
         window.removeEventListener('resize', updateViewportPlacement);
      };

      app.canvas.addEventListener('DOMNodeRemovedFromDocument', cleanupResize);
      (app as any)._cleanupResize = cleanupResize;


      // Checkerboard
      const checkerboard = new PIXI.Graphics();
      for(let x=0; x < canvasWidth; x++) {
        for(let y=0; y < canvasHeight; y++) {
          checkerboard.rect(x, y, 1, 1);
          checkerboard.fill((x + y) % 2 === 0 ? 0xcccccc : 0x999999);
        }
      }

      viewport.addChild(checkerboard);

      const layerContainer = new PIXI.Container();
      layerContainer.sortableChildren = true;
      viewport.addChild(layerContainer);

      // Grid overlay — pixel grid at high zoom + optional center lines
      const gridGraphics = new PIXI.Graphics();
      gridGraphics.zIndex = 9998;
      viewport.addChild(gridGraphics);

      const redrawGrid = () => {
        gridGraphics.clear();
        const edS = useEditorStore.getState();
        const zoom = viewport.scale.x;

        // Pixel grid at high zoom (>= 800%)
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

        // Center / symmetry lines
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

      // Selection overlay — marching ants drawn on a dedicated graphics object
      const selectionGraphics = new PIXI.Graphics();
      selectionGraphics.zIndex = 9999;
      viewport.addChild(selectionGraphics);

      let marchingAntsOffset = 0;

      const redrawSelection = () => {
        drawSelectionOverlay(selectionGraphics, viewport, canvasWidth, canvasHeight, marchingAntsOffset);
      };

      marchingAntsTimerRef = setInterval(() => {
        marchingAntsOffset = (marchingAntsOffset + 1) % 100;
        redrawSelection();
      }, 150);

      const drawingCanvas = document.createElement('canvas');
      drawingCanvas.width = canvasWidth;
      drawingCanvas.height = canvasHeight;
      const ctx = drawingCanvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const drawingTexture = PIXI.Texture.from(drawingCanvas);
      drawingTexture.source.scaleMode = 'nearest';

      let currentActiveLayerId: string | null = null;
      let lastKnownFrameId: string | null = null;
      const currentActiveLayerRef = { current: currentActiveLayerId };
      const lastKnownFrameRef = { current: lastKnownFrameId };

      const doSyncLayers = () => {
        syncLayers(layerContainer, drawingTexture, drawingCanvas, ctx, canvasWidth, canvasHeight, appRef, currentActiveLayerRef, lastKnownFrameRef);
      };

      unsubscribeProjectStore = useProjectStore.subscribe(doSyncLayers);
      unsubscribeEditorStore = useEditorStore.subscribe((state, prevState) => {
        if (
          state.onionSkinEnabled !== prevState.onionSkinEnabled ||
          state.onionSkinBefore !== prevState.onionSkinBefore ||
          state.onionSkinAfter !== prevState.onionSkinAfter ||
          state.onionSkinOpacity !== prevState.onionSkinOpacity ||
          state.onionSkinBeforeTint !== prevState.onionSkinBeforeTint ||
          state.onionSkinAfterTint !== prevState.onionSkinAfterTint ||
          state.zoomLevel !== prevState.zoomLevel
        ) {
          doSyncLayers();
        }
        if (
          state.showGrid !== prevState.showGrid ||
          state.showCenterLines !== prevState.showCenterLines ||
          state.zoomLevel !== prevState.zoomLevel
        ) {
          redrawGrid();
        }
      });
      doSyncLayers();

      app.stage.addChild(viewport);

      app.stage.eventMode = 'static';
      app.stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

      let isDrawing = false;
      let isPanning = false;
      let startPos = { x: 0, y: 0 };
      let lastDrawPos = { x: 0, y: 0 };
      let lastPanPos = { x: 0, y: 0 };
      let snapshotBeforeDraw: ImageData | null = null;

      // Helper to get tool properties
      const getToolPropLocal = <T extends number | string | boolean>(tool: string, key: string, defaultVal: T): T => {
        return getToolProp<T>(tool, key, defaultVal);
      };

      /**
       * Commit a canvas operation with undo support.
       */
      const commitLocal = (label: string, beforeData: ImageData) => {
        commitWithUndo(label, beforeData, drawingCanvas, ctx, drawingTexture, canvasWidth, canvasHeight);
      };

      // Wire canvas actions service
      setCanvasActions({
        flipHorizontal: () => {
          const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
          const mask = useEditorStore.getState().selectionMask;
          flipHorizontal(ctx, canvasWidth, canvasHeight, mask);
          drawingTexture.source.update();
          commitLocal('Flip horizontal', before);
        },
        flipVertical: () => {
          const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
          const mask = useEditorStore.getState().selectionMask;
          flipVertical(ctx, canvasWidth, canvasHeight, mask);
          drawingTexture.source.update();
          commitLocal('Flip vertical', before);
        },
        rotateCw: () => {
          const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
          const mask = useEditorStore.getState().selectionMask;
          rotateCw(ctx, canvasWidth, canvasHeight, mask);
          drawingTexture.source.update();
          commitLocal('Rotate clockwise', before);
        },
        rotateCcw: () => {
          const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
          const mask = useEditorStore.getState().selectionMask;
          rotateCcw(ctx, canvasWidth, canvasHeight, mask);
          drawingTexture.source.update();
          commitLocal('Rotate counter-clockwise', before);
        },
        selectAll: () => {
          const mask = new Uint8Array(canvasWidth * canvasHeight);
          mask.fill(1);
          useEditorStore.getState().setSelectionMask(mask);
          redrawSelection();
        },
        clearSelection: () => {
          useEditorStore.getState().setSelectionMask(null);
          redrawSelection();
        },
        hasSelection: () => !isSelectionEmpty(useEditorStore.getState().selectionMask),
        fitToScreen: () => {
          if (!containerRef.current) return;
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          const padding = 40;
          const scaleX = (cw - padding * 2) / canvasWidth;
          const scaleY = (ch - padding * 2) / canvasHeight;
          const newScale = Math.min(scaleX, scaleY);
          const newZoom = Math.round(newScale * 10);
          useEditorStore.getState().setZoomLevel(Math.max(10, Math.min(3000, newZoom)));
          viewport.scale.set(newScale);
          viewport.x = (cw - canvasWidth * newScale) / 2;
          viewport.y = (ch - canvasHeight * newScale) / 2;
          redrawGrid();
        },
        zoomToSelection: () => {
          if (!containerRef.current) return;
          const mask = useEditorStore.getState().selectionMask;
          if (!mask) return;
          const bounds = getSelectionBounds(mask, canvasWidth, canvasHeight);
          if (!bounds) return;
          const { minX, minY, maxX, maxY } = bounds;
          const selW = maxX - minX + 1;
          const selH = maxY - minY + 1;
          const cw = containerRef.current.clientWidth;
          const ch = containerRef.current.clientHeight;
          const padding = 40;
          const scaleX = (cw - padding * 2) / selW;
          const scaleY = (ch - padding * 2) / selH;
          const newScale = Math.min(scaleX, scaleY);
          const newZoom = Math.round(newScale * 10);
          useEditorStore.getState().setZoomLevel(Math.max(10, Math.min(3000, newZoom)));
          viewport.scale.set(newScale);
          viewport.x = (cw / 2) - ((minX + selW / 2) * newScale);
          viewport.y = (ch / 2) - ((minY + selH / 2) * newScale);
          redrawGrid();
        },
        copySelection: () => {
          const mask = useEditorStore.getState().selectionMask;
          if (!mask) return;
          const bounds = getSelectionBounds(mask, canvasWidth, canvasHeight);
          if (!bounds) return;
          const { minX, minY, maxX, maxY } = bounds;
          const w = maxX - minX + 1;
          const h = maxY - minY + 1;
          const srcData = ctx.getImageData(minX, minY, w, h);
          // Mask out pixels outside selection
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const maskIdx = (minY + y) * canvasWidth + (minX + x);
              if (!mask[maskIdx]) {
                const idx = (y * w + x) * 4;
                srcData.data[idx + 3] = 0;
              }
            }
          }
          const dataUrl = imageDataToDataURL(srcData, w, h);
          useEditorStore.getState().setClipboard({ data: dataUrl, width: w, height: h, offsetX: minX, offsetY: minY });
        },
        pasteClipboard: () => {
          const clip = useEditorStore.getState().clipboard;
          if (!clip) return;
          const before = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, clip.offsetX, clip.offsetY);
            drawingTexture.source.update();
            commitLocal('Paste', before);
          };
          img.src = clip.data;
        },
        mergeDown: () => {
          const pState = useProjectStore.getState();
          const sheetId = pState.activeSpritesheetId;
          const frameId = pState.activeFrameId;
          const layerId = pState.activeLayerId;
          if (!sheetId || !frameId || !layerId) return;

          const sheet = pState.project?.spritesheets.find(s => s.id === sheetId);
          const frame = sheet?.frames.find(f => f.id === frameId);
          if (!frame) return;

          const layerIndex = frame.layers.findIndex(l => l.id === layerId);
          if (layerIndex <= 0) return; // Can't merge the bottom layer

          const topLayer = frame.layers[layerIndex];
          const bottomLayer = frame.layers[layerIndex - 1];

          // Composite top layer onto bottom layer
          const mergeCanvas = document.createElement('canvas');
          mergeCanvas.width = canvasWidth;
          mergeCanvas.height = canvasHeight;
          const mergeCtx = mergeCanvas.getContext('2d')!;

          // Draw bottom layer first
          const drawLayer = (layer: typeof topLayer, done: () => void) => {
            if (!layer.data) { done(); return; }
            const img = new Image();
            img.onload = () => {
              mergeCtx.globalAlpha = layer.opacity ?? 1;
              mergeCtx.drawImage(img, 0, 0);
              mergeCtx.globalAlpha = 1;
              done();
            };
            img.onerror = done;
            img.src = layer.data;
          };

          drawLayer(bottomLayer, () => {
            drawLayer(topLayer, () => {
              const mergedData = mergeCanvas.toDataURL('image/png');

              // Snapshot for undo
              const topSnapshot = { ...topLayer };
              const bottomSnapshot = { ...bottomLayer };

              // Update bottom layer with merged data, remove top layer
              useProjectStore.getState().updateLayer(sheetId, frameId, bottomLayer.id, { data: mergedData });
              useProjectStore.getState().removeLayer(sheetId, frameId, topLayer.id);
              useProjectStore.getState().setActiveLayer(bottomLayer.id);

              // Reload the drawing canvas with the new active layer
              doSyncLayers();

              useHistoryStore.getState().push({
                label: 'Merge down',
                undo: () => {
                  // Restore both layers
                  useProjectStore.getState().updateLayer(sheetId, frameId, bottomLayer.id, { data: bottomSnapshot.data });
                  useProjectStore.getState().addLayer(sheetId, frameId, topSnapshot);
                  // Move restored layer to correct position
                  const ps = useProjectStore.getState();
                  const curFrame = ps.project?.spritesheets.find(s => s.id === sheetId)?.frames.find(f => f.id === frameId);
                  if (curFrame) {
                    const curIdx = curFrame.layers.length - 1;
                    if (curIdx !== layerIndex) {
                      ps.reorderLayers(sheetId, frameId, curIdx, layerIndex);
                    }
                  }
                  ps.setActiveLayer(topSnapshot.id);
                },
                redo: () => {
                  useProjectStore.getState().updateLayer(sheetId, frameId, bottomLayer.id, { data: mergedData });
                  useProjectStore.getState().removeLayer(sheetId, frameId, topLayer.id);
                  useProjectStore.getState().setActiveLayer(bottomLayer.id);
                },
              });
            });
          });
        },
      });

      app.stage.on('pointerdown', (e) => {
        const edState = useEditorStore.getState();
        const tool = edState.activeTool;

        // Middle mouse, Space held, or move tool = pan
        if (e.button === 1 || isSpaceHeld || tool === 'move') {
          isPanning = true;
          lastPanPos = { x: e.global.x, y: e.global.y };
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
          const newMask = createMagicWandSelection(ctx, px, py, tolerance, true, canvasWidth, canvasHeight);
          const combined = combineSelections(useEditorStore.getState().selectionMask, newMask, selectionMode);
          useEditorStore.getState().setSelectionMask(isSelectionEmpty(combined) ? null : combined);
          redrawSelection();
          return;
        }

        // Start drawing for drag-based tools
        isDrawing = true;
        startPos = { x: px, y: py };
        lastDrawPos = { x: px, y: py };
        snapshotBeforeDraw = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

        // Initial point for pencil/eraser
        if (tool === 'pencil' || tool === 'eraser') {
          const brushSize = getToolPropLocal<number>(tool, 'brushSize', 1);
          const brushShape = getToolPropLocal<string>(tool, 'brushShape', 'square') as BrushShape;
          drawBrush(ctx, px, py, brushSize, brushShape, edState.primaryColor, tool === 'eraser');
          drawingTexture.source.update();
        }
      });

      app.stage.on('pointermove', (e) => {
        if (isPanning) {
          const dx = e.global.x - lastPanPos.x;
          const dy = e.global.y - lastPanPos.y;
          viewport.x += dx;
          viewport.y += dy;
          lastPanPos = { x: e.global.x, y: e.global.y };
          return;
        }

        if (!isDrawing) return;

        const localPos = viewport.toLocal(e.global);
        const px = Math.floor(localPos.x);
        const py = Math.floor(localPos.y);
        const edState = useEditorStore.getState();
        const tool = edState.activeTool;

        if (tool === 'pencil' || tool === 'eraser') {
          const brushSize = getToolPropLocal<number>(tool, 'brushSize', 1);
          const brushShape = getToolPropLocal<string>(tool, 'brushShape', 'square') as BrushShape;

          // Draw line from last position to current for continuous stroke
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

          lastDrawPos = { x: px, y: py };
          drawingTexture.source.update();
        } else if (tool === 'line') {
          if (snapshotBeforeDraw) {
            ctx.putImageData(snapshotBeforeDraw, 0, 0);
            const thickness = getToolPropLocal<number>('line', 'brushSize', 1);
            drawLine(ctx, startPos.x, startPos.y, px, py, edState.primaryColor, thickness, 'square');
            drawingTexture.source.update();
          }
        } else if (tool === 'rectangle') {
          if (snapshotBeforeDraw) {
            ctx.putImageData(snapshotBeforeDraw, 0, 0);
            const filled = getToolPropLocal<boolean>('rectangle', 'filled', false);
            const strokeWidth = getToolPropLocal<number>('rectangle', 'brushSize', 1);
            drawRectangle(ctx, startPos.x, startPos.y, px, py, edState.primaryColor, filled, strokeWidth);
            drawingTexture.source.update();
          }
        } else if (tool === 'ellipse') {
          if (snapshotBeforeDraw) {
            ctx.putImageData(snapshotBeforeDraw, 0, 0);
            const filled = getToolPropLocal<boolean>('ellipse', 'filled', false);
            const strokeWidth = getToolPropLocal<number>('ellipse', 'brushSize', 1);
            drawEllipse(ctx, startPos.x, startPos.y, px, py, edState.primaryColor, filled, strokeWidth);
            drawingTexture.source.update();
          }
        } else if (tool === 'selection') {
          // Preview the selection rectangle/ellipse via the overlay
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
          lastDrawPos = { x: px, y: py };
        }
      });

      const commitDataFlow = () => {
        if (isDrawing) {
          isDrawing = false;

          // Finalize selection tool drag
          const edState = useEditorStore.getState();
          if (edState.activeTool === 'selection') {
            const selectionShape = getToolPropLocal<string>('selection', 'selectionShape', 'rectangle');
            const selectionMode = getToolPropLocal<string>('selection', 'selectionMode', 'replace') as 'replace' | 'add' | 'subtract' | 'intersect';
            const newMask = selectionShape === 'ellipse'
              ? createEllipseSelection(startPos.x, startPos.y, lastDrawPos.x, lastDrawPos.y, canvasWidth, canvasHeight)
              : createRectSelection(startPos.x, startPos.y, lastDrawPos.x, lastDrawPos.y, canvasWidth, canvasHeight);
            const combined = combineSelections(edState.selectionMask, newMask, selectionMode);
            edState.setSelectionMask(isSelectionEmpty(combined) ? null : combined);
            redrawSelection();
          } else if (snapshotBeforeDraw) {
            const toolName = edState.activeTool;
            commitLocal(toolName.charAt(0).toUpperCase() + toolName.slice(1), snapshotBeforeDraw);
          }
        }
        isPanning = false;
        if (containerRef.current && !isSpaceHeld) containerRef.current.style.cursor = '';
      };

      app.stage.on('pointerup', commitDataFlow);
      app.stage.on('pointerupoutside', commitDataFlow);

      // Wheel Zoom
      app.canvas.addEventListener('wheel', (e) => {
         e.preventDefault();
         const edState = useEditorStore.getState();
         const delta = e.deltaY < 0 ? 10 : -10;
         const newZoom = Math.max(10, Math.min(3000, edState.zoomLevel + delta));
         edState.setZoomLevel(newZoom);
         const pointerX = e.offsetX;
         const pointerY = e.offsetY;
         const worldPos = { x: (pointerX - viewport.x) / viewport.scale.x, y: (pointerY - viewport.y) / viewport.scale.y };
         viewport.scale.set(newZoom / 10);
         viewport.x = pointerX - (worldPos.x * viewport.scale.x);
         viewport.y = pointerY - (worldPos.y * viewport.scale.y);
         redrawGrid();
      }, { passive: false });
    };

    initPixi();

    return () => {
      isCancelled = true;
      setCanvasActions(null);
      if (marchingAntsTimerRef) clearInterval(marchingAntsTimerRef);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (appRef.current) {
        try {
          if ((appRef.current as any)._cleanupResize) {
            (appRef.current as any)._cleanupResize();
          }
          appRef.current.destroy(true, { children: true });
        } catch (e) {
          console.warn("Pixi destroy error caught:", e);
        }
        appRef.current = null;
        if (unsubscribeProjectStore) unsubscribeProjectStore();
        if (unsubscribeEditorStore) unsubscribeEditorStore();
      }
    };
  }, [project?.id, canvasW, canvasH]);

  return (
    <div
      className="flex-1 w-full h-full overflow-hidden relative flex items-center justify-center bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setFocusedView('canvas')}
    >
      {!project && <div className="text-slate-500">No project loaded</div>}
    </div>
  );
};
