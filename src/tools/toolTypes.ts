import type { IconType } from 'react-icons';

// ── Property types (unchanged from old toolDefinitions.ts) ──

export type ToolPropertyType = 'number' | 'select' | 'boolean';

export interface ToolPropertyBase {
  key: string;
  label: string;
  type: ToolPropertyType;
}

export interface NumberProperty extends ToolPropertyBase {
  type: 'number';
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface SelectProperty extends ToolPropertyBase {
  type: 'select';
  options: { value: string; label: string }[];
  default: string;
}

export interface BooleanProperty extends ToolPropertyBase {
  type: 'boolean';
  default: boolean;
}

export type ToolProperty = NumberProperty | SelectProperty | BooleanProperty;

// ── Pointer event passed to tool callbacks ──

export interface ToolPointerEvent {
  /** Pixel coordinates (floored) on the canvas */
  x: number;
  y: number;
  /** Raw Pixi global coordinates (sub-pixel) */
  globalX: number;
  globalY: number;
  /** Mouse button (0=left, 1=middle, 2=right) */
  button: number;
  /** Modifier keys */
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

// ── Canvas API surface exposed to tools ──

export interface ToolContext {
  /** The 2D context of the active layer's drawing canvas */
  readonly ctx: CanvasRenderingContext2D;
  /** Canvas dimensions */
  readonly width: number;
  readonly height: number;

  /** Preview layer (non-destructive drawing during drag) */
  readonly previewCtx: CanvasRenderingContext2D;
  showPreview(): void;
  hidePreview(): void;
  clearPreview(): void;

  /** Selection mask (null = no selection) */
  readonly selectionMask: Uint8Array | null;
  setSelectionMask(mask: Uint8Array | null): void;
  redrawSelection(): void;

  /** Selection graphics overlay for drawing selection outlines */
  readonly selectionGraphics: {
    clear(): void;
    rect(x: number, y: number, w: number, h: number): void;
    ellipse(cx: number, cy: number, rx: number, ry: number): void;
    stroke(opts: { width: number; color: number; pixelLine: boolean }): void;
  };
  readonly viewportScale: number;

  /** Colors */
  readonly primaryColor: string;
  readonly secondaryColor: string;
  setPrimaryColor(color: string): void;

  /** Read a tool property value */
  getProperty<T extends number | string | boolean>(key: string): T;

  /** Capture a snapshot for undo (call in onPointerDown before mutating) */
  captureSnapshot(): ImageData;

  /** Commit changes with undo support */
  commit(label: string, snapshotBefore: ImageData): void;

  /** Force the drawing texture to update on screen */
  refreshTexture(): void;

  /** Set CSS cursor for duration of interaction */
  setCursor(cursor: string): void;

  /** Per-tool scratch state that persists across a single drag gesture.
   *  Reset to {} before each onPointerDown. */
  dragState: Record<string, unknown>;
}

// ── Tool modes ──

/** instant = fires on click only (fill, picker, flip)
 *  drag    = captures snapshot, calls move/up (pencil, move, scale)
 *  preview = draws on preview layer during drag, composites on up (line, rect, ellipse)
 *  selection = handles selection creation (no commit, manages mask) */
export type ToolMode = 'instant' | 'drag' | 'preview' | 'selection';

// ── The unified tool definition ──

export interface ToolDefinition {
  /** Unique tool ID (e.g. 'pencil', 'myPlugin.smudge') */
  id: string;

  /** i18n key for display name */
  labelKey: string;
  /** Fallback display name */
  defaultLabel: string;

  /** Icon component (react-icons compatible) */
  icon: IconType;

  /** Category for sidebar grouping */
  category: string;

  /** Default cursor when tool is active */
  cursor?: string;

  /** Configurable properties shown in the tool options panel */
  properties: ToolProperty[];

  /** Behavioral mode */
  mode: ToolMode;

  // ── Lifecycle ──
  onActivate?(ctx: ToolContext): void;
  onDeactivate?(ctx: ToolContext): void;

  // ── Pointer interaction ──
  onPointerDown(event: ToolPointerEvent, ctx: ToolContext): void;
  onPointerMove?(event: ToolPointerEvent, ctx: ToolContext): void;
  onPointerUp?(event: ToolPointerEvent, ctx: ToolContext): void;
}
