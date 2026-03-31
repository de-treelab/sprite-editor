/**
 * Canvas actions service — a module-level ref that PixiEditor populates
 * when mounted. Commands call into it without needing callback threading.
 */

export interface CanvasActions {
  flipHorizontal(): void;
  flipVertical(): void;
  rotateCw(): void;
  rotateCcw(): void;
  selectAll(): void;
  clearSelection(): void;
  /** Returns true if a non-empty selection exists */
  hasSelection(): boolean;
  fitToScreen(): void;
  zoomToSelection(): void;
  copySelection(): void;
  pasteClipboard(): void;
  mergeDown(): void;
}

let current: CanvasActions | null = null;

export function setCanvasActions(actions: CanvasActions | null): void {
  current = actions;
}

export function getCanvasActions(): CanvasActions | null {
  return current;
}
