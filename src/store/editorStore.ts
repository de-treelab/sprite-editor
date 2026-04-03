import { create } from 'zustand';
import { buildDefaultToolProperties, getTool } from '../tools/toolRegistry';
import '../tools/builtins'; // ensure built-in tools are registered
import { KeybindingsConfig, defaultKeybindings, ViewType } from '../config/keybindings';

export type Tool = string;
export type LoopMode = 'loop' | 'oneshot' | 'pingpong';

// Tool property values stored per-tool
export type ToolProperties = Record<string, Record<string, number | string | boolean>>;

// ── Tool property persistence ──

const TOOL_PROPS_STORAGE_KEY = 'toolProperties';

function loadPersistedToolProperties(): Record<string, Record<string, unknown>> {
  try {
    const raw = localStorage.getItem(TOOL_PROPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistToolProperties(toolProperties: ToolProperties) {
  const sparse: Record<string, Record<string, unknown>> = {};
  for (const [toolId, props] of Object.entries(toolProperties)) {
    const toolDef = getTool(toolId);
    if (!toolDef) continue;
    for (const [key, value] of Object.entries(props)) {
      const propDef = toolDef.properties.find((p) => p.key === key);
      if (propDef && value !== propDef.default) {
        sparse[toolId] ??= {};
        sparse[toolId][key] = value;
      }
    }
  }
  localStorage.setItem(TOOL_PROPS_STORAGE_KEY, JSON.stringify(sparse));
}

function buildInitialToolProperties(): ToolProperties {
  const defaults = buildDefaultToolProperties();
  const persisted = loadPersistedToolProperties();
  for (const [toolId, props] of Object.entries(persisted)) {
    if (defaults[toolId]) {
      Object.assign(defaults[toolId], props);
    }
  }
  return defaults;
}

// Re-export ViewType for convenience
export type { ViewType };

interface EditorState {
  activeTool: Tool;
  toolProperties: ToolProperties;
  primaryColor: string;
  secondaryColor: string;
  zoomLevel: number;
  focusedView: ViewType | null;
  hiddenViews: Set<ViewType>;
  fullscreenView: ViewType | null;
  keybindings: KeybindingsConfig;

  onionSkinEnabled: boolean;
  onionSkinBefore: number;
  onionSkinAfter: number;
  onionSkinOpacity: number;
  onionSkinBeforeTint: string;
  onionSkinAfterTint: string;

  showGrid: boolean;
  showCenterLines: boolean;

  clipboard: { data: string; width: number; height: number; offsetX: number; offsetY: number } | null;

  selectionMask: Uint8Array | null;

  isPlaying: boolean;
  playbackTime: number;
  playbackSpeed: number;
  playbackFrameId: string | null;
  loopMode: LoopMode;
  loopStart: number | null;
  loopEnd: number | null;
  snapInterval: number;
  pingpongReverse: boolean;

  setActiveTool: (tool: Tool) => void;
  setToolProperty: (tool: Tool, key: string, value: number | string | boolean) => void;
  getToolProperty: <T extends number | string | boolean>(tool: Tool, key: string) => T;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setZoomLevel: (zoom: number) => void;
  setFocusedView: (view: ViewType | null) => void;
  toggleHiddenView: (view: ViewType) => void;
  toggleFullscreenView: (view: ViewType) => void;
  setKeybindings: (keybindings: KeybindingsConfig) => void;

  setOnionSkinEnabled: (enabled: boolean) => void;
  setOnionSkinBefore: (count: number) => void;
  setOnionSkinAfter: (count: number) => void;
  setOnionSkinOpacity: (opacity: number) => void;
  setOnionSkinBeforeTint: (color: string) => void;
  setOnionSkinAfterTint: (color: string) => void;

  setShowGrid: (show: boolean) => void;
  setShowCenterLines: (show: boolean) => void;

  setClipboard: (
    clip: { data: string; width: number; height: number; offsetX: number; offsetY: number } | null,
  ) => void;

  setIsPlaying: (playing: boolean) => void;
  setPlaybackTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackFrameId: (frameId: string | null) => void;
  setLoopMode: (mode: LoopMode) => void;
  setLoopStart: (time: number | null) => void;
  setLoopEnd: (time: number | null) => void;
  setSnapInterval: (interval: number) => void;
  setPingpongReverse: (reverse: boolean) => void;

  setSelectionMask: (mask: Uint8Array | null) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'pencil',
  toolProperties: buildInitialToolProperties(),
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  zoomLevel: 100,
  focusedView: null,
  hiddenViews: new Set<ViewType>(),
  fullscreenView: null,
  keybindings: defaultKeybindings,

  onionSkinEnabled: false,
  onionSkinBefore: 1,
  onionSkinAfter: 1,
  onionSkinOpacity: 0.3,
  onionSkinBeforeTint: '#ff4444',
  onionSkinAfterTint: '#4444ff',

  showGrid: false,
  showCenterLines: false,

  clipboard: null,

  selectionMask: null,

  isPlaying: false,
  playbackTime: 0,
  playbackSpeed: 1,
  playbackFrameId: null,
  loopMode: 'loop',
  loopStart: null,
  loopEnd: null,
  snapInterval: 20,
  pingpongReverse: false,

  setActiveTool: (tool) => set({ activeTool: tool }),

  setToolProperty: (tool, key, value) => {
    set((state) => {
      const newProps = {
        ...state.toolProperties,
        [tool]: {
          ...state.toolProperties[tool],
          [key]: value,
        },
      };
      persistToolProperties(newProps);
      return { toolProperties: newProps };
    });
  },

  getToolProperty: <T extends number | string | boolean>(tool: Tool, key: string): T => {
    return get().toolProperties[tool]?.[key] as T;
  },

  setPrimaryColor: (color) => set({ primaryColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setFocusedView: (view) => set({ focusedView: view }),
  toggleHiddenView: (view) =>
    set((state) => {
      const next = new Set(state.hiddenViews);
      if (next.has(view)) {
        next.delete(view);
      } else {
        next.add(view);
      }
      return { hiddenViews: next, fullscreenView: state.fullscreenView === view ? null : state.fullscreenView };
    }),
  toggleFullscreenView: (view) =>
    set((state) => ({
      fullscreenView: state.fullscreenView === view ? null : view,
    })),
  setKeybindings: (keybindings) => set({ keybindings }),

  setOnionSkinEnabled: (enabled) => set({ onionSkinEnabled: enabled }),
  setOnionSkinBefore: (count) => set({ onionSkinBefore: count }),
  setOnionSkinAfter: (count) => set({ onionSkinAfter: count }),
  setOnionSkinOpacity: (opacity) => set({ onionSkinOpacity: opacity }),
  setOnionSkinBeforeTint: (color) => set({ onionSkinBeforeTint: color }),
  setOnionSkinAfterTint: (color) => set({ onionSkinAfterTint: color }),

  setShowGrid: (show) => set({ showGrid: show }),
  setShowCenterLines: (show) => set({ showCenterLines: show }),

  setClipboard: (clip) => set({ clipboard: clip }),

  setIsPlaying: (playing) => set({ isPlaying: playing, pingpongReverse: playing ? get().pingpongReverse : false }),
  setPlaybackTime: (time) => set({ playbackTime: time }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setPlaybackFrameId: (id) => set({ playbackFrameId: id }),
  setLoopMode: (mode) => set({ loopMode: mode }),
  setLoopStart: (time) => set({ loopStart: time }),
  setLoopEnd: (time) => set({ loopEnd: time }),
  setSnapInterval: (interval) => set({ snapInterval: interval }),
  setPingpongReverse: (reverse) => set({ pingpongReverse: reverse }),

  setSelectionMask: (mask) => set({ selectionMask: mask }),
}));
