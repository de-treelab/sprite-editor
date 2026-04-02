import { useEffect } from 'react';
import { registerCommand, unregisterCommand } from '../config/commandRegistry';
import { useEditorStore } from '../store/editorStore';
import { IconRegistry } from '../components/IconRegistry';
import { getCanvasActions } from './canvasActions';
import { clamp } from '../utils/math';
import { CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM } from '../components/Canvas/canvasUtils';

function swapColors() {
  const state = useEditorStore.getState();
  const primary = state.primaryColor;
  state.setPrimaryColor(state.secondaryColor);
  state.setSecondaryColor(primary);
}

/**
 * Registers all canvas-scoped commands: tool switching, zoom, flip, selection.
 * Call in a component that is mounted when the canvas is available (e.g. PixiEditor).
 */
export function useCanvasCommands() {
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel);

  useEffect(() => {
    // Tool commands
    registerCommand({ key: 'canvas.toolPencil', view: 'canvas', icon: IconRegistry.ToolPencil, handler: () => setActiveTool('pencil') });
    registerCommand({ key: 'canvas.toolEraser', view: 'canvas', icon: IconRegistry.ToolEraser, handler: () => setActiveTool('eraser') });
    registerCommand({ key: 'canvas.toolFill', view: 'canvas', icon: IconRegistry.ToolFill, handler: () => setActiveTool('fill') });
    registerCommand({ key: 'canvas.toolPicker', view: 'canvas', icon: IconRegistry.ToolPicker, handler: () => setActiveTool('picker') });
    registerCommand({ key: 'canvas.toolMove', view: 'canvas', icon: IconRegistry.ToolMove, handler: () => setActiveTool('move') });
    registerCommand({ key: 'canvas.toolPan', view: 'canvas', icon: IconRegistry.ToolPan, handler: () => setActiveTool('pan') });
    registerCommand({ key: 'canvas.toolScale', view: 'canvas', icon: IconRegistry.ToolScale, handler: () => setActiveTool('scale') });
    registerCommand({ key: 'canvas.toolRotate', view: 'canvas', icon: IconRegistry.ToolRotate, handler: () => setActiveTool('rotate') });
    registerCommand({ key: 'canvas.toolTransform', view: 'canvas', icon: IconRegistry.ToolTransform, handler: () => setActiveTool('transform') });
    registerCommand({ key: 'canvas.toolSelection', view: 'canvas', icon: IconRegistry.ToolSelect, handler: () => setActiveTool('selection') });
    registerCommand({ key: 'canvas.toolMagicWand', view: 'canvas', icon: IconRegistry.ToolMagicWand, handler: () => setActiveTool('magicWand') });
    registerCommand({ key: 'canvas.toolLine', view: 'canvas', icon: IconRegistry.ToolLine, handler: () => setActiveTool('line') });
    registerCommand({ key: 'canvas.toolRectangle', view: 'canvas', icon: IconRegistry.ToolRectangle, handler: () => setActiveTool('rectangle') });
    registerCommand({ key: 'canvas.toolEllipse', view: 'canvas', icon: IconRegistry.ToolEllipse, handler: () => setActiveTool('ellipse') });

    // Flip commands
    registerCommand({
      key: 'canvas.flipHorizontal',
      view: 'canvas',
      icon: IconRegistry.ToolFlipHorizontal,
      enabled: () => getCanvasActions() !== null,
      handler: () => getCanvasActions()?.flipHorizontal(),
    });
    registerCommand({
      key: 'canvas.flipVertical',
      view: 'canvas',
      icon: IconRegistry.ToolFlipVertical,
      enabled: () => getCanvasActions() !== null,
      handler: () => getCanvasActions()?.flipVertical(),
    });

    // Rotate commands
    registerCommand({
      key: 'canvas.rotateCw',
      view: 'canvas',
      icon: IconRegistry.RotateCw,
      enabled: () => getCanvasActions() !== null,
      handler: () => getCanvasActions()?.rotateCw(),
    });
    registerCommand({
      key: 'canvas.rotateCcw',
      view: 'canvas',
      icon: IconRegistry.RotateCcw,
      enabled: () => getCanvasActions() !== null,
      handler: () => getCanvasActions()?.rotateCcw(),
    });

    // Selection commands
    registerCommand({
      key: 'canvas.selectAll',
      view: 'canvas',
      enabled: () => getCanvasActions() !== null,
      handler: () => getCanvasActions()?.selectAll(),
    });
    registerCommand({
      key: 'canvas.clearSelection',
      view: 'canvas',
      enabled: () => getCanvasActions()?.hasSelection() ?? false,
      handler: () => getCanvasActions()?.clearSelection(),
    });

    // Zoom commands — use a getter for current zoom so the handler always reads fresh state
    registerCommand({
      key: 'canvas.zoomIn',
      view: 'canvas',
      handler: () => {
        const zoom = useEditorStore.getState().zoomLevel;
        useEditorStore.getState().setZoomLevel(clamp(zoom * 1.25, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM));
      },
    });
    registerCommand({
      key: 'canvas.zoomOut',
      view: 'canvas',
      handler: () => {
        const zoom = useEditorStore.getState().zoomLevel;
        useEditorStore.getState().setZoomLevel(clamp(zoom / 1.25, CANVAS_MIN_ZOOM, CANVAS_MAX_ZOOM));
      },
    });
    registerCommand({
      key: 'canvas.zoomReset',
      view: 'canvas',
      handler: () => useEditorStore.getState().setZoomLevel(100),
    });

    // Fit-to-screen / zoom-to-selection
    registerCommand({
      key: 'canvas.fitToScreen',
      view: 'canvas',
      enabled: () => getCanvasActions() !== null,
      handler: () => getCanvasActions()?.fitToScreen(),
    });
    registerCommand({
      key: 'canvas.zoomToSelection',
      view: 'canvas',
      enabled: () => getCanvasActions()?.hasSelection() ?? false,
      handler: () => getCanvasActions()?.zoomToSelection(),
    });

    // Grid toggles
    registerCommand({
      key: 'canvas.toggleGrid',
      view: 'canvas',
      handler: () => {
        const s = useEditorStore.getState();
        s.setShowGrid(!s.showGrid);
      },
    });
    registerCommand({
      key: 'canvas.toggleCenterLines',
      view: 'canvas',
      handler: () => {
        const s = useEditorStore.getState();
        s.setShowCenterLines(!s.showCenterLines);
      },
    });

    // Swap colors
    registerCommand({
      key: 'canvas.swapColors',
      view: 'canvas',
      icon: IconRegistry.SwapColors,
      handler: swapColors,
    });

    // Copy/Paste
    registerCommand({
      key: 'canvas.copy',
      view: 'canvas',
      enabled: () => getCanvasActions()?.hasSelection() ?? false,
      handler: () => getCanvasActions()?.copySelection(),
    });
    registerCommand({
      key: 'canvas.paste',
      view: 'canvas',
      enabled: () => useEditorStore.getState().clipboard !== null,
      handler: () => getCanvasActions()?.pasteClipboard(),
    });

    return () => {
      for (const key of [
        'canvas.toolPencil', 'canvas.toolEraser', 'canvas.toolFill', 'canvas.toolPicker',
        'canvas.toolMove', 'canvas.toolPan', 'canvas.toolScale', 'canvas.toolRotate', 'canvas.toolTransform',
        'canvas.toolSelection', 'canvas.toolMagicWand', 'canvas.toolLine',
        'canvas.toolRectangle', 'canvas.toolEllipse', 'canvas.flipHorizontal', 'canvas.flipVertical',
        'canvas.rotateCw', 'canvas.rotateCcw',
        'canvas.selectAll', 'canvas.clearSelection',
        'canvas.zoomIn', 'canvas.zoomOut', 'canvas.zoomReset',
        'canvas.fitToScreen', 'canvas.zoomToSelection',
        'canvas.toggleGrid', 'canvas.toggleCenterLines',
        'canvas.copy', 'canvas.paste',
        'canvas.swapColors',
      ]) {
        unregisterCommand(key);
      }
    };
  }, [setActiveTool, setZoomLevel]);
}
