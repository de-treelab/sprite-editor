import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { commitWithUndo, getToolProp } from './canvasUtils';
import { getTool } from '../../tools/toolRegistry';
import type { ToolContext, ToolPointerEvent } from '../../tools/toolTypes';
import type { PixiEditorContext } from './editorContext';

/**
 * Attach pointer-event handlers (down / move / up) to the Pixi stage.
 * This is now a thin dispatcher that delegates to the active tool's callbacks.
 */
export function setupPointerHandlers(ec: PixiEditorContext) {
  const {
    app,
    viewport,
    containerRef,
    ctx,
    drawingTexture,
    drawingCanvas,
    previewCanvas,
    previewCtx,
    previewTexture,
    previewSprite,
    selectionGraphics,
    canvasWidth,
    canvasHeight,
    interaction,
  } = ec;

  // Shared dragState for the current gesture
  let currentDragState: Record<string, unknown> = {};

  const commitLocal = (label: string, beforeData: ImageData) => {
    commitWithUndo(label, beforeData, drawingCanvas, ctx, drawingTexture, canvasWidth, canvasHeight);
  };

  /** Build a ToolContext for the currently active tool */
  function buildToolContext(toolId: string): ToolContext {
    const edState = useEditorStore.getState();
    return {
      ctx,
      width: canvasWidth,
      height: canvasHeight,

      previewCtx,
      showPreview() {
        previewSprite.visible = true;
      },
      hidePreview() {
        previewSprite.visible = false;
      },
      clearPreview() {
        previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      },

      get selectionMask() {
        return useEditorStore.getState().selectionMask;
      },
      setSelectionMask(mask: Uint8Array | null) {
        useEditorStore.getState().setSelectionMask(mask);
      },
      redrawSelection() {
        ec.redrawSelection();
      },

      selectionGraphics: {
        clear: () => selectionGraphics.clear(),
        rect: (x: number, y: number, w: number, h: number) => selectionGraphics.rect(x, y, w, h),
        ellipse: (cx: number, cy: number, rx: number, ry: number) => selectionGraphics.ellipse(cx, cy, rx, ry),
        stroke: (opts: { width: number; color: number; pixelLine: boolean }) => selectionGraphics.stroke(opts),
      },
      get viewportScale() {
        return viewport.scale.x || 1;
      },

      primaryColor: edState.primaryColor,
      secondaryColor: edState.secondaryColor,
      setPrimaryColor(color: string) {
        useEditorStore.getState().setPrimaryColor(color);
      },

      getProperty<T extends number | string | boolean>(key: string): T {
        return getToolProp<T>(toolId, key, undefined as unknown as T);
      },

      captureSnapshot() {
        return ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      },

      commit(label: string, snapshotBefore: ImageData) {
        commitLocal(label, snapshotBefore);
      },

      refreshTexture() {
        drawingTexture.source.update();
      },

      setCursor(cursor: string) {
        if (containerRef.current) containerRef.current.style.cursor = cursor;
      },

      dragState: currentDragState,
    };
  }

  /** Build a ToolPointerEvent from a Pixi FederatedPointerEvent */
  function buildPointerEvent(e: { global: { x: number; y: number }; button: number }): ToolPointerEvent {
    const localPos = viewport.toLocal(e.global);
    return {
      x: Math.floor(localPos.x),
      y: Math.floor(localPos.y),
      globalX: e.global.x,
      globalY: e.global.y,
      button: e.button,
      shiftKey: false,
      ctrlKey: false,
      altKey: false,
    };
  }

  /** Check if we can draw on the active layer */
  function canDrawOnActiveLayer(): boolean {
    const pState = useProjectStore.getState();
    const frame = pState.project?.spritesheets
      .find((s) => s.id === pState.activeSpritesheetId)
      ?.frames.find((f) => f.id === pState.activeFrameId);
    const activeLayer = frame?.layers.find((l) => l.id === pState.activeLayerId);
    return !!(activeLayer && !activeLayer.locked && activeLayer.visible !== false);
  }

  // ── Pointer Down ──

  app.stage.on('pointerdown', (e) => {
    const edState = useEditorStore.getState();
    const toolId = edState.activeTool;

    // Middle mouse, Space held, or pan tool = viewport pan
    if (e.button === 1 || interaction.isSpaceHeld || toolId === 'pan') {
      interaction.isPanning = true;
      interaction.lastPanPos = { x: e.global.x, y: e.global.y };
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      return;
    }

    // Layer guard
    if (!canDrawOnActiveLayer()) return;

    // Look up the active tool from registry
    const toolDef = getTool(toolId);
    if (!toolDef) return;

    // Build event + context
    const event = buildPointerEvent(e);
    currentDragState = {};
    const toolCtx = buildToolContext(toolId);

    // Mode-specific setup
    if (toolDef.mode === 'drag') {
      const snapshot = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      interaction.snapshotBeforeDraw = snapshot;
      interaction.isDrawing = true;
      interaction.startPos = { x: event.x, y: event.y };
      interaction.lastDrawPos = { x: event.x, y: event.y };
      // Store snapshot in dragState for tools that need to restore it each move
      currentDragState.snapshot = snapshot;
    } else if (toolDef.mode === 'preview') {
      interaction.snapshotBeforeDraw = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      interaction.isDrawing = true;
      interaction.startPos = { x: event.x, y: event.y };
      toolCtx.clearPreview();
      toolCtx.showPreview();
    } else if (toolDef.mode === 'selection') {
      interaction.isDrawing = true;
      interaction.startPos = { x: event.x, y: event.y };
      interaction.lastDrawPos = { x: event.x, y: event.y };
    }

    // Delegate to tool
    toolDef.onPointerDown(event, toolCtx);
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

    const toolId = useEditorStore.getState().activeTool;
    const toolDef = getTool(toolId);
    if (!toolDef?.onPointerMove) return;

    const event = buildPointerEvent(e);
    const toolCtx = buildToolContext(toolId);
    toolDef.onPointerMove(event, toolCtx);

    if (toolDef.mode === 'preview') {
      previewTexture.source.update();
      previewSprite.visible = true;
    }
  });

  // ── Pointer Up / Commit ──

  const commitDataFlow = (e: { global: { x: number; y: number }; button: number }) => {
    if (interaction.isDrawing) {
      interaction.isDrawing = false;
      const toolId = useEditorStore.getState().activeTool;
      const toolDef = getTool(toolId);

      if (toolDef) {
        const event = buildPointerEvent(e);
        const toolCtx = buildToolContext(toolId);

        // Preview tools: composite preview onto drawing canvas
        if (toolDef.mode === 'preview' && previewSprite.visible) {
          ctx.drawImage(previewCanvas, 0, 0);
          drawingTexture.source.update();
          previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
          previewSprite.visible = false;
        }

        // Call tool's onPointerUp
        toolDef.onPointerUp?.(event, toolCtx);

        // Auto-commit for drag/preview tools
        if ((toolDef.mode === 'drag' || toolDef.mode === 'preview') && interaction.snapshotBeforeDraw) {
          commitLocal(toolDef.defaultLabel, interaction.snapshotBeforeDraw);
          interaction.snapshotBeforeDraw = null;
        }
      }
    }

    interaction.isPanning = false;
    if (containerRef.current && !interaction.isSpaceHeld) {
      const toolId = useEditorStore.getState().activeTool;
      const toolDef = getTool(toolId);
      containerRef.current.style.cursor = toolDef?.cursor || '';
    }
  };

  app.stage.on('pointerup', commitDataFlow);
  app.stage.on('pointerupoutside', commitDataFlow);
}
