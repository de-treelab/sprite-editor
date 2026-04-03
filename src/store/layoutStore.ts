import { create } from 'zustand';
import type { Layout, SavedLayout, FloatingPanel, Anchor } from '../layouts/layoutTypes';
import { DEFAULT_LAYOUT } from '../layouts/defaultLayout';
import { viewExistsInTree, removeViewFromTree, insertViewAtAnchor, generatePanelId } from '../layouts/layoutUtils';

const STORAGE_KEY_LAYOUTS = 'layouts:saved';
const STORAGE_KEY_PROJECT_MAP = 'layouts:projectMap';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupt */
  }
  return fallback;
}

function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let floatingZCounter = 100;

interface LayoutState {
  layout: Layout;
  activeLayoutId: string | null;
  savedLayouts: SavedLayout[];
  projectLayoutMap: Record<string, string>;

  // Tree mutations
  moveView: (viewId: string, targetPanelId: string, anchor: Anchor) => void;
  addView: (viewId: string, targetPanelId: string, anchor: Anchor) => void;
  removeView: (viewId: string) => void;
  setActiveTab: (panelId: string, viewId: string) => void;
  setSplitSizes: (splitId: string, sizes: number[]) => void;

  // Floating
  floatView: (viewId: string, position: { x: number; y: number }) => void;
  dockFloating: (floatingPanelId: string, targetPanelId: string, anchor: Anchor) => void;
  moveFloating: (panelId: string, position: { x: number; y: number }) => void;
  resizeFloating: (panelId: string, size: { width: number; height: number }) => void;
  bringFloatingToFront: (panelId: string) => void;

  // Visibility
  toggleViewHidden: (viewId: string) => void;
  setFullscreenView: (viewId: string | null) => void;

  // Save / Load
  saveLayout: (name: string) => string;
  overwriteLayout: (id: string) => void;
  loadLayout: (id: string) => void;
  deleteLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  resetLayout: () => void;

  // Project binding
  setProjectLayout: (projectPath: string, layoutId: string) => void;
  loadProjectLayout: (projectPath: string) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  layout: deepClone(DEFAULT_LAYOUT),
  activeLayoutId: null,
  savedLayouts: loadJson<SavedLayout[]>(STORAGE_KEY_LAYOUTS, []),
  projectLayoutMap: loadJson<Record<string, string>>(STORAGE_KEY_PROJECT_MAP, {}),

  moveView: (viewId, targetPanelId, anchor) =>
    set((state) => {
      // Remove from current location (tree + floating)
      let root = removeViewFromTree(state.layout.root, viewId);
      const floating = state.layout.floating
        .filter((f) => !(f.viewIds.includes(viewId) && f.viewIds.length === 1))
        .map((f) => {
          if (!f.viewIds.includes(viewId)) return f;
          const newViewIds = f.viewIds.filter((id) => id !== viewId);
          return { ...f, viewIds: newViewIds, activeViewId: newViewIds[0] ?? '' };
        })
        .filter((f) => f.viewIds.length > 0);

      // Insert at new location
      root = insertViewAtAnchor(root, viewId, targetPanelId, anchor);
      return { layout: { ...state.layout, root, floating } };
    }),

  addView: (viewId, targetPanelId, anchor) =>
    set((state) => {
      const root = insertViewAtAnchor(state.layout.root, viewId, targetPanelId, anchor);
      return { layout: { ...state.layout, root } };
    }),

  removeView: (viewId) =>
    set((state) => {
      const root = removeViewFromTree(state.layout.root, viewId);
      const floating = state.layout.floating
        .map((f) => {
          if (!f.viewIds.includes(viewId)) return f;
          const newViewIds = f.viewIds.filter((id) => id !== viewId);
          return { ...f, viewIds: newViewIds, activeViewId: newViewIds[0] ?? '' };
        })
        .filter((f) => f.viewIds.length > 0);
      const hiddenViewIds = state.layout.hiddenViewIds.filter((id) => id !== viewId);
      const fullscreenViewId = state.layout.fullscreenViewId === viewId ? null : state.layout.fullscreenViewId;
      return { layout: { ...state.layout, root, floating, hiddenViewIds, fullscreenViewId } };
    }),

  setActiveTab: (panelId, viewId) =>
    set((state) => {
      const updateNode = (node: typeof state.layout.root): typeof state.layout.root => {
        if (node.type === 'panel') {
          if (node.id === panelId && node.viewIds.includes(viewId)) {
            return { ...node, activeViewId: viewId };
          }
          return node;
        }
        return { ...node, children: node.children.map(updateNode) };
      };
      // Also check floating panels
      const floating = state.layout.floating.map((f) => {
        if (f.panelId === panelId && f.viewIds.includes(viewId)) {
          return { ...f, activeViewId: viewId };
        }
        return f;
      });
      return { layout: { ...state.layout, root: updateNode(state.layout.root), floating } };
    }),

  setSplitSizes: (splitId, sizes) =>
    set((state) => {
      const updateNode = (node: typeof state.layout.root): typeof state.layout.root => {
        if (node.type === 'split') {
          if (node.id === splitId) return { ...node, sizes };
          return { ...node, children: node.children.map(updateNode) };
        }
        return node;
      };
      return { layout: { ...state.layout, root: updateNode(state.layout.root) } };
    }),

  floatView: (viewId, position) =>
    set((state) => {
      // Remove from tree if already docked
      let root = state.layout.root;
      if (viewExistsInTree(root, viewId)) {
        root = removeViewFromTree(root, viewId);
      }
      // Remove from existing floating panels
      let floating = state.layout.floating
        .map((f) => {
          if (!f.viewIds.includes(viewId)) return f;
          const newViewIds = f.viewIds.filter((id) => id !== viewId);
          return { ...f, viewIds: newViewIds, activeViewId: newViewIds[0] ?? '' };
        })
        .filter((f) => f.viewIds.length > 0);

      // Un-hide if hidden
      const hiddenViewIds = state.layout.hiddenViewIds.filter((id) => id !== viewId);

      const newFloating: FloatingPanel = {
        panelId: generatePanelId(),
        viewIds: [viewId],
        activeViewId: viewId,
        x: position.x,
        y: position.y,
        width: 400,
        height: 300,
        zIndex: ++floatingZCounter,
      };
      floating = [...floating, newFloating];
      return { layout: { ...state.layout, root, floating, hiddenViewIds } };
    }),

  dockFloating: (floatingPanelId, targetPanelId, anchor) =>
    set((state) => {
      const fp = state.layout.floating.find((f) => f.panelId === floatingPanelId);
      if (!fp) return state;

      let root = state.layout.root;
      // Insert each view from the floating panel
      for (const vId of fp.viewIds) {
        root = insertViewAtAnchor(root, vId, targetPanelId, anchor);
      }
      const floating = state.layout.floating.filter((f) => f.panelId !== floatingPanelId);
      return { layout: { ...state.layout, root, floating } };
    }),

  moveFloating: (panelId, position) =>
    set((state) => ({
      layout: {
        ...state.layout,
        floating: state.layout.floating.map((f) =>
          f.panelId === panelId ? { ...f, x: position.x, y: position.y } : f,
        ),
      },
    })),

  resizeFloating: (panelId, size) =>
    set((state) => ({
      layout: {
        ...state.layout,
        floating: state.layout.floating.map((f) =>
          f.panelId === panelId ? { ...f, width: size.width, height: size.height } : f,
        ),
      },
    })),

  bringFloatingToFront: (panelId) =>
    set((state) => ({
      layout: {
        ...state.layout,
        floating: state.layout.floating.map((f) => (f.panelId === panelId ? { ...f, zIndex: ++floatingZCounter } : f)),
      },
    })),

  toggleViewHidden: (viewId) =>
    set((state) => {
      const hidden = state.layout.hiddenViewIds;
      const hiddenViewIds = hidden.includes(viewId) ? hidden.filter((id) => id !== viewId) : [...hidden, viewId];
      return { layout: { ...state.layout, hiddenViewIds } };
    }),

  setFullscreenView: (viewId) =>
    set((state) => ({
      layout: { ...state.layout, fullscreenViewId: viewId },
    })),

  saveLayout: (name) => {
    const state = get();
    const id = crypto.randomUUID();
    const now = Date.now();
    const saved: SavedLayout = {
      id,
      name,
      layout: deepClone(state.layout),
      createdAt: now,
      updatedAt: now,
    };
    const savedLayouts = [...state.savedLayouts, saved];
    saveJson(STORAGE_KEY_LAYOUTS, savedLayouts);
    set({ savedLayouts, activeLayoutId: id });
    return id;
  },

  overwriteLayout: (id) => {
    const state = get();
    const savedLayouts = state.savedLayouts.map((s) =>
      s.id === id ? { ...s, layout: deepClone(state.layout), updatedAt: Date.now() } : s,
    );
    saveJson(STORAGE_KEY_LAYOUTS, savedLayouts);
    set({ savedLayouts, activeLayoutId: id });
  },

  loadLayout: (id) => {
    const state = get();
    const saved = state.savedLayouts.find((s) => s.id === id);
    if (!saved) return;
    set({
      layout: deepClone(saved.layout),
      activeLayoutId: id,
    });
  },

  deleteLayout: (id) => {
    const state = get();
    const savedLayouts = state.savedLayouts.filter((s) => s.id !== id);
    saveJson(STORAGE_KEY_LAYOUTS, savedLayouts);
    if (state.activeLayoutId === id) {
      set({ savedLayouts, activeLayoutId: null, layout: deepClone(DEFAULT_LAYOUT) });
    } else {
      set({ savedLayouts });
    }
  },

  renameLayout: (id, name) => {
    const state = get();
    const savedLayouts = state.savedLayouts.map((s) => (s.id === id ? { ...s, name, updatedAt: Date.now() } : s));
    saveJson(STORAGE_KEY_LAYOUTS, savedLayouts);
    set({ savedLayouts });
  },

  resetLayout: () =>
    set({
      layout: deepClone(DEFAULT_LAYOUT),
      activeLayoutId: null,
    }),

  setProjectLayout: (projectPath, layoutId) => {
    const state = get();
    const projectLayoutMap = { ...state.projectLayoutMap, [projectPath]: layoutId };
    saveJson(STORAGE_KEY_PROJECT_MAP, projectLayoutMap);
    set({ projectLayoutMap });
  },

  loadProjectLayout: (projectPath) => {
    const state = get();
    const layoutId = state.projectLayoutMap[projectPath];
    if (layoutId) {
      const saved = state.savedLayouts.find((s) => s.id === layoutId);
      if (saved) {
        set({
          layout: deepClone(saved.layout),
          activeLayoutId: layoutId,
        });
        return;
      }
    }
    // Fallback: reset to default
    set({
      layout: deepClone(DEFAULT_LAYOUT),
      activeLayoutId: null,
    });
  },
}));
