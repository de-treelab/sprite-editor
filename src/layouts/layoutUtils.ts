// Pure helper functions for layout tree operations
import type { LayoutNode, LayoutPanel, LayoutSplit, Anchor, SplitDirection } from './layoutTypes';

/** Find a panel by its ID */
export function findPanel(node: LayoutNode, panelId: string): LayoutPanel | null {
  if (node.type === 'panel') {
    return node.id === panelId ? node : null;
  }
  for (const child of node.children) {
    const found = findPanel(child, panelId);
    if (found) return found;
  }
  return null;
}

/** Find the panel containing a given viewId */
export function findPanelByViewId(node: LayoutNode, viewId: string): LayoutPanel | null {
  if (node.type === 'panel') {
    return node.viewIds.includes(viewId) ? node : null;
  }
  for (const child of node.children) {
    const found = findPanelByViewId(child, viewId);
    if (found) return found;
  }
  return null;
}

/** Check if a viewId exists anywhere in the tree */
export function viewExistsInTree(node: LayoutNode, viewId: string): boolean {
  return findPanelByViewId(node, viewId) !== null;
}

/** Find the parent split of a given node ID */
export function findParent(root: LayoutNode, nodeId: string): LayoutSplit | null {
  if (root.type === 'panel') return null;
  for (const child of root.children) {
    if (child.id === nodeId) return root;
    if (child.type === 'split') {
      const found = findParent(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}

/** Generate a unique panel ID */
let panelCounter = 0;
export function generatePanelId(): string {
  return `panel-${Date.now()}-${++panelCounter}`;
}

/** Generate a unique split ID */
let splitCounter = 0;
export function generateSplitId(): string {
  return `split-${Date.now()}-${++splitCounter}`;
}

/** Remove a view from a panel. Returns the updated tree (may collapse empty panels/splits). */
export function removeViewFromTree(root: LayoutNode, viewId: string): LayoutNode {
  return cleanupTree(removeViewFromNode(root, viewId));
}

function removeViewFromNode(node: LayoutNode, viewId: string): LayoutNode {
  if (node.type === 'panel') {
    if (!node.viewIds.includes(viewId)) return node;
    const newViewIds = node.viewIds.filter((id) => id !== viewId);
    const newActiveViewId = node.activeViewId === viewId ? (newViewIds[0] ?? '') : node.activeViewId;
    return { ...node, viewIds: newViewIds, activeViewId: newActiveViewId };
  }
  return {
    ...node,
    children: node.children.map((child) => removeViewFromNode(child, viewId)),
  };
}

/** Clean up the tree: remove empty panels and collapse single-child splits */
export function cleanupTree(node: LayoutNode): LayoutNode {
  if (node.type === 'panel') return node;

  // Recurse first
  let children = node.children.map(cleanupTree);
  let sizes = [...node.sizes];

  // Remove empty panels
  const filtered: LayoutNode[] = [];
  const filteredSizes: number[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === 'panel' && child.viewIds.length === 0) continue;
    filtered.push(child);
    filteredSizes.push(sizes[i]);
  }
  children = filtered;
  sizes = filteredSizes;

  // Normalize sizes
  if (sizes.length > 0) {
    const total = sizes.reduce((a, b) => a + b, 0);
    if (total > 0) {
      sizes = sizes.map((s) => s / total);
    }
  }

  // If only one child remains, collapse the split
  if (children.length === 1) return children[0];

  // If no children, return an empty panel as placeholder
  if (children.length === 0) {
    return { type: 'panel', id: generatePanelId(), viewIds: [], activeViewId: '' };
  }

  return { ...node, children, sizes };
}

/**
 * Insert a view into the tree at a given panel + anchor.
 * - 'center': adds as a tab in the target panel
 * - other anchors: wraps the target panel in a split
 */
export function insertViewAtAnchor(
  root: LayoutNode,
  viewId: string,
  targetPanelId: string,
  anchor: Anchor,
): LayoutNode {
  if (anchor === 'center') {
    return addViewToPanel(root, targetPanelId, viewId);
  }
  return splitPanelAtAnchor(root, targetPanelId, viewId, anchor);
}

function addViewToPanel(node: LayoutNode, panelId: string, viewId: string): LayoutNode {
  if (node.type === 'panel') {
    if (node.id !== panelId) return node;
    if (node.viewIds.includes(viewId)) return node;
    return { ...node, viewIds: [...node.viewIds, viewId], activeViewId: viewId };
  }
  return {
    ...node,
    children: node.children.map((child) => addViewToPanel(child, panelId, viewId)),
  };
}

function splitPanelAtAnchor(
  node: LayoutNode,
  targetPanelId: string,
  viewId: string,
  anchor: 'left' | 'right' | 'top' | 'bottom',
): LayoutNode {
  if (node.type === 'panel') {
    if (node.id !== targetPanelId) return node;
    return createSplitFromAnchor(node, viewId, anchor);
  }
  return {
    ...node,
    children: node.children.map((child) => splitPanelAtAnchor(child, targetPanelId, viewId, anchor)),
  };
}

function createSplitFromAnchor(
  existingPanel: LayoutPanel,
  viewId: string,
  anchor: 'left' | 'right' | 'top' | 'bottom',
): LayoutSplit {
  const direction: SplitDirection = anchor === 'left' || anchor === 'right' ? 'horizontal' : 'vertical';
  const newPanel: LayoutPanel = {
    type: 'panel',
    id: generatePanelId(),
    viewIds: [viewId],
    activeViewId: viewId,
  };

  const isBeforeExisting = anchor === 'left' || anchor === 'top';
  const children: LayoutNode[] = isBeforeExisting ? [newPanel, existingPanel] : [existingPanel, newPanel];

  return {
    type: 'split',
    id: generateSplitId(),
    direction,
    children,
    sizes: [0.5, 0.5],
  };
}

/** Replace a node in the tree by ID */
export function replaceNode(root: LayoutNode, nodeId: string, replacement: LayoutNode): LayoutNode {
  if (root.id === nodeId) return replacement;
  if (root.type === 'panel') return root;
  return {
    ...root,
    children: root.children.map((child) => replaceNode(child, nodeId, replacement)),
  };
}

/** Collect all viewIds present in the tree */
export function collectViewIds(node: LayoutNode): string[] {
  if (node.type === 'panel') return [...node.viewIds];
  return node.children.flatMap(collectViewIds);
}
