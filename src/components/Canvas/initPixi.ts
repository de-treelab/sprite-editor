import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { syncLayers, disposeLayerSync } from './layerSync';
import { setCanvasActions } from '../../hooks/canvasActions';
import { CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM } from './canvasUtils';
import { clamp } from '../../utils/math';
import { toolDefinitions, ToolId } from '../../tools/toolDefinitions';
import { setupViewport } from './viewportSetup';
import { setupCanvasActions } from './canvasActionsSetup';
import { setupPointerHandlers } from './pointerHandlers';
import type { PixiEditorContext } from './editorContext';

export interface InitPixiParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  appRef: React.MutableRefObject<PIXI.Application | null>;
  viewportRef: React.MutableRefObject<PIXI.Container | null>;
  canvasW: number;
  canvasH: number;
}

export interface InitPixiCleanup {
  destroy: () => void;
}

/**
 * Initialize the Pixi application, set up the viewport, canvas actions,
 * pointer handlers, store subscriptions, and wheel zoom.
 *
 * Returns a cleanup function for the React effect teardown.
 */
export function initPixiEditor(params: InitPixiParams): InitPixiCleanup {
  const { containerRef, appRef, viewportRef, canvasW, canvasH } = params;

  let isCancelled = false;
  let marchingAntsTimerRef: ReturnType<typeof setInterval> | null = null;
  let unsubscribeProjectStore: (() => void) | undefined;
  let unsubscribeEditorStore: (() => void) | undefined;

  const app = new PIXI.Application();

  // ── Space-key tracking for pan ──
  const interaction = {
    isDrawing: false,
    isPanning: false,
    startPos: { x: 0, y: 0 },
    lastDrawPos: { x: 0, y: 0 },
    lastPanPos: { x: 0, y: 0 },
    snapshotBeforeDraw: null as ImageData | null,
    isSpaceHeld: false,
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !e.repeat && useEditorStore.getState().focusedView === 'canvas') {
      e.preventDefault();
      interaction.isSpaceHeld = true;
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      interaction.isSpaceHeld = false;
      if (containerRef.current) {
        const tool = useEditorStore.getState().activeTool as ToolId;
        containerRef.current.style.cursor = toolDefinitions[tool]?.cursor || '';
      }
    }
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // Async init
  const boot = async () => {
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

    // ── Viewport + overlays ──
    const vp = setupViewport(app, canvasWidth, canvasHeight);
    const { viewport, layerContainer, redrawGrid, redrawSelection, marchingAntsTimer, currentZoom } = vp;
    viewportRef.current = viewport;
    marchingAntsTimerRef = marchingAntsTimer;

    // Center viewport
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
    const cleanupResize = () => window.removeEventListener('resize', updateViewportPlacement);
    app.canvas.addEventListener('DOMNodeRemovedFromDocument', cleanupResize);
    (app as any)._cleanupResize = cleanupResize;

    // ── Layer synchronisation ──
    let currentActiveLayerId: string | null = null;
    let lastKnownFrameId: string | null = null;
    const currentActiveLayerRef = { current: currentActiveLayerId };
    const lastKnownFrameRef = { current: lastKnownFrameId };

    const doSyncLayers = () => {
      syncLayers(layerContainer, vp.drawingTexture, vp.drawingCanvas, vp.ctx, canvasWidth, canvasHeight, appRef, currentActiveLayerRef, lastKnownFrameRef);
    };

    // ── Build editor context ──
    const ec: PixiEditorContext = {
      app,
      viewport,
      containerRef,
      appRef,
      canvasWidth,
      canvasHeight,
      drawingCanvas: vp.drawingCanvas,
      ctx: vp.ctx,
      drawingTexture: vp.drawingTexture,
      previewCanvas: vp.previewCanvas,
      previewCtx: vp.previewCtx,
      previewTexture: vp.previewTexture,
      previewSprite: vp.previewSprite,
      selectionGraphics: vp.selectionGraphics,
      checkerboard: vp.checkerboard,
      redrawGrid,
      redrawSelection,
      doSyncLayers,
      interaction,
    };

    // ── Canvas actions (flip, rotate, clipboard, merge, ...) ──
    setupCanvasActions(ec);

    // ── Pointer handlers (draw, pan, tool interactions) ──
    setupPointerHandlers(ec);

    // ── Store subscriptions ──
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
      if (state.activeTool !== prevState.activeTool && containerRef.current && !interaction.isSpaceHeld) {
        const toolDef = toolDefinitions[state.activeTool as ToolId];
        containerRef.current.style.cursor = toolDef?.cursor || '';
      }
    });
    doSyncLayers();

    // ── Wheel Zoom ──
    app.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const edState = useEditorStore.getState();
      const delta = e.deltaY < 0 ? 10 : -10;
      const newZoom = clamp(edState.zoomLevel + delta, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM);
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

  boot();

  return {
    destroy: () => {
      isCancelled = true;
      setCanvasActions(null);
      disposeLayerSync();
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
          console.warn('Pixi destroy error caught:', e);
        }
        appRef.current = null;
        unsubscribeProjectStore?.();
        unsubscribeEditorStore?.();
      }
    },
  };
}
