import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { useHistoryStore } from '../../store/historyStore';
import { setCanvasActions } from '../../hooks/canvasActions';
import {
  flipHorizontal,
  flipVertical,
  rotateCw,
  rotateCcw,
  isSelectionEmpty,
  getSelectionBounds,
} from '../../tools/drawingUtils';
import { commitWithUndo, imageDataToDataURL, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM } from './canvasUtils';
import { clamp } from '../../utils/math';
import type { PixiEditorContext } from './editorContext';

/**
 * Wire all canvas-action callbacks (flip, rotate, selection, clipboard, merge, zoom helpers).
 */
export function setupCanvasActions(ec: PixiEditorContext) {
  const { ctx, drawingTexture, drawingCanvas, canvasWidth, canvasHeight, viewport, containerRef } = ec;

  const commitLocal = (label: string, beforeData: ImageData) => {
    commitWithUndo(label, beforeData, drawingCanvas, ctx, drawingTexture, canvasWidth, canvasHeight);
  };

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
      ec.redrawSelection();
    },
    clearSelection: () => {
      useEditorStore.getState().setSelectionMask(null);
      ec.redrawSelection();
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
      useEditorStore.getState().setZoomLevel(clamp(newZoom, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM));
      viewport.scale.set(newScale);
      viewport.x = (cw - canvasWidth * newScale) / 2;
      viewport.y = (ch - canvasHeight * newScale) / 2;
      ec.redrawGrid();
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
      useEditorStore.getState().setZoomLevel(clamp(newZoom, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM));
      viewport.scale.set(newScale);
      viewport.x = cw / 2 - (minX + selW / 2) * newScale;
      viewport.y = ch / 2 - (minY + selH / 2) * newScale;
      ec.redrawGrid();
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

      const sheet = pState.project?.spritesheets.find((s) => s.id === sheetId);
      const frame = sheet?.frames.find((f) => f.id === frameId);
      if (!frame) return;

      const layerIndex = frame.layers.findIndex((l) => l.id === layerId);
      if (layerIndex <= 0) return;

      const topLayer = frame.layers[layerIndex];
      const bottomLayer = frame.layers[layerIndex - 1];

      const mergeCanvas = document.createElement('canvas');
      mergeCanvas.width = canvasWidth;
      mergeCanvas.height = canvasHeight;
      const mergeCtx = mergeCanvas.getContext('2d')!;

      const drawLayer = (layer: typeof topLayer, done: () => void) => {
        if (!layer.data) {
          done();
          return;
        }
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
          const topSnapshot = { ...topLayer };
          const bottomSnapshot = { ...bottomLayer };

          useProjectStore.getState().updateLayer(sheetId, frameId, bottomLayer.id, { data: mergedData });
          useProjectStore.getState().removeLayer(sheetId, frameId, topLayer.id);
          useProjectStore.getState().setActiveLayer(bottomLayer.id);

          ec.doSyncLayers();

          useHistoryStore.getState().push({
            label: 'Merge down',
            undo: () => {
              useProjectStore.getState().updateLayer(sheetId, frameId, bottomLayer.id, { data: bottomSnapshot.data });
              useProjectStore.getState().addLayer(sheetId, frameId, topSnapshot);
              const ps = useProjectStore.getState();
              const curFrame = ps.project?.spritesheets
                .find((s) => s.id === sheetId)
                ?.frames.find((f) => f.id === frameId);
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
}
