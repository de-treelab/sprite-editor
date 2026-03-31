import { useProjectStore } from '../../store/projectStore';
import { useHistoryStore } from '../../store/historyStore';

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

  const beforeURL = imageDataToDataURL(beforeData, canvasWidth, canvasHeight);
  const afterURL = drawingCanvas.toDataURL();

  useProjectStore.getState().updateLayer(sheetId, frameId, layerId, { data: afterURL });

  useHistoryStore.getState().push({
    label,
    undo: () => {
      useProjectStore.getState().updateLayer(sheetId, frameId, layerId, { data: beforeURL });
      const cur = useProjectStore.getState();
      if (cur.activeSpritesheetId === sheetId && cur.activeFrameId === frameId && cur.activeLayerId === layerId) {
        restoreImageToCanvas(beforeURL, ctx, drawingTexture, canvasWidth, canvasHeight);
      }
    },
    redo: () => {
      useProjectStore.getState().updateLayer(sheetId, frameId, layerId, { data: afterURL });
      const cur = useProjectStore.getState();
      if (cur.activeSpritesheetId === sheetId && cur.activeFrameId === frameId && cur.activeLayerId === layerId) {
        restoreImageToCanvas(afterURL, ctx, drawingTexture, canvasWidth, canvasHeight);
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
