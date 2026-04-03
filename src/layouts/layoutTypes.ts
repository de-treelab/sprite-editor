// Layout system type definitions
// The layout is a recursive tree of split containers and leaf panels.

export type Anchor = 'left' | 'right' | 'top' | 'bottom' | 'center';
export type SplitDirection = 'horizontal' | 'vertical';

/** A leaf node holding one or more tabbed views */
export interface LayoutPanel {
  type: 'panel';
  id: string;
  viewIds: string[];
  activeViewId: string;
}

/** A split container holding two or more children with resizable dividers */
export interface LayoutSplit {
  type: 'split';
  id: string;
  direction: SplitDirection;
  children: LayoutNode[];
  sizes: number[]; // proportional sizes (sum = 1)
}

export type LayoutNode = LayoutPanel | LayoutSplit;

/** A floating window */
export interface FloatingPanel {
  panelId: string;
  viewIds: string[];
  activeViewId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

/** Complete serializable layout state */
export interface Layout {
  root: LayoutNode;
  floating: FloatingPanel[];
  hiddenViewIds: string[];
  fullscreenViewId: string | null;
}

/** A saved layout with metadata */
export interface SavedLayout {
  id: string;
  name: string;
  layout: Layout;
  createdAt: number;
  updatedAt: number;
}
