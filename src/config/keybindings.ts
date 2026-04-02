// Keybinding configuration with defaults
// Users can override these through editor settings

export type ViewType = 'canvas' | 'timeline' | 'navigator' | 'preview';

// Global keybindings (work regardless of focused view)
export interface GlobalKeybindings {
  // View focus switching
  focusCanvas: string;
  focusTimeline: string;
  focusPreview: string;
  focusNavigator: string;

  // View visibility
  hideCanvas: string;
  hideTimeline: string;
  hidePreview: string;
  hideNavigator: string;

  // View fullscreen
  fullscreenCanvas: string;
  fullscreenTimeline: string;
  fullscreenPreview: string;
  fullscreenNavigator: string;

  // File operations
  saveProject: string;
  saveProjectWithoutTask: string;
  openProject: string;
  newProject: string;

  // Edit operations
  undo: string;
  redo: string;

  // Command palette
  openCommandPalette: string;

  // Layout management
  saveLayout: string;
  manageLayouts: string;
  resetLayout: string;

  // Wiki
  openWiki: string;
}

// Canvas-specific keybindings
export interface CanvasKeybindings {
  // Tools
  toolPencil: string;
  toolEraser: string;
  toolFill: string;
  toolPicker: string;
  toolMove: string;
  toolPan: string;
  toolScale: string;
  toolRotate: string;
  toolTransform: string;
  toolSelection: string;
  toolMagicWand: string;
  toolLine: string;
  toolRectangle: string;
  toolEllipse: string;

  // Actions
  flipHorizontal: string;
  flipVertical: string;
  rotateCw: string;
  rotateCcw: string;
  selectAll: string;
  clearSelection: string;
  zoomIn: string;
  zoomOut: string;
  zoomReset: string;
  fitToScreen: string;
  zoomToSelection: string;
  toggleGrid: string;
  toggleCenterLines: string;
  copy: string;
  paste: string;
  swapColors: string;
}

// Timeline-specific keybindings (includes keyframe editing)
export interface TimelineKeybindings {
  playPause: string;
  stop: string;
  nextFrame: string;
  prevFrame: string;
  stepForward: string;
  stepBackward: string;
  toggleLoopMode: string;
  addKeyframe: string;
  deleteKeyframe: string;
  duplicateKeyframe: string;
}



// Navigator keybindings
export interface NavigatorKeybindings {
  newFrame: string;
  deleteFrame: string;
  duplicateFrame: string;
  newLayer: string;
  deleteLayer: string;
}

export interface KeybindingsConfig {
  global: GlobalKeybindings;
  canvas: CanvasKeybindings;
  timeline: TimelineKeybindings;
  navigator: NavigatorKeybindings;
}

// Default keybindings
export const defaultKeybindings: KeybindingsConfig = {
  global: {
    focusCanvas: 'ctrl+1',
    focusTimeline: 'ctrl+2',
    focusPreview: 'ctrl+3',
    focusNavigator: 'ctrl+4',
    hideCanvas: 'ctrl+shift+1',
    hideTimeline: 'ctrl+shift+2',
    hidePreview: 'ctrl+shift+3',
    hideNavigator: 'ctrl+shift+4',
    fullscreenCanvas: 'ctrl+alt+1',
    fullscreenTimeline: 'ctrl+alt+2',
    fullscreenPreview: 'ctrl+alt+3',
    fullscreenNavigator: 'ctrl+alt+4',
    saveProject: 'ctrl+s',
    saveProjectWithoutTask: 'ctrl+shift+s',
    openProject: 'ctrl+o',
    newProject: 'ctrl+n',
    undo: 'ctrl+z',
    redo: 'ctrl+shift+z',
    openCommandPalette: 'ctrl+shift+p',
    saveLayout: 'ctrl+shift+l',
    manageLayouts: 'ctrl+alt+l',
    resetLayout: '',
    openWiki: 'f1',
  },
  canvas: {
    toolPencil: 'b',
    toolEraser: 'e',
    toolFill: 'g',
    toolPicker: 'i',
    toolMove: 'v',
    toolPan: 'h',
    toolScale: 's',
    toolRotate: 'r',
    toolTransform: 't',
    toolSelection: 'm',
    toolMagicWand: 'w',
    toolLine: 'l',
    toolRectangle: 'u',
    toolEllipse: 'o',
    flipHorizontal: 'shift+h',
    flipVertical: 'shift+v',
    rotateCw: 'shift+r',
    rotateCcw: 'shift+l',
    selectAll: 'ctrl+a',
    clearSelection: 'ctrl+d',
    zoomIn: 'ctrl+=',
    zoomOut: 'ctrl+-',
    zoomReset: 'ctrl+0',
    fitToScreen: 'ctrl+shift+f',
    zoomToSelection: 'ctrl+shift+e',
    toggleGrid: "ctrl+'",
    toggleCenterLines: "ctrl+;",
    copy: 'ctrl+c',
    paste: 'ctrl+v',
    swapColors: 'x',
  },
  timeline: {
    playPause: 'space',
    stop: 'escape',
    nextFrame: 'right',
    prevFrame: 'left',
    stepForward: 'shift+right',
    stepBackward: 'shift+left',
    toggleLoopMode: 'ctrl+l',
    addKeyframe: 'k',
    deleteKeyframe: 'delete',
    duplicateKeyframe: 'ctrl+d',
  },
  navigator: {
    newFrame: 'ctrl+shift+n',
    deleteFrame: 'delete',
    duplicateFrame: 'ctrl+d',
    newLayer: 'ctrl+shift+l',
    deleteLayer: 'shift+delete',
  },
};

// View display names for UI
export const viewDisplayNames: Record<ViewType, string> = {
  canvas: 'Canvas',
  timeline: 'Timeline',
  preview: 'Preview',
  navigator: 'Navigator',
};
