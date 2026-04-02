// Keybinding settings — one setting per keybinding action
import { SettingDefinition } from './settings';
import { defaultKeybindings } from './keybindings';

function kb(subcategory: string, key: string, label: string, defaultValue: string): SettingDefinition {
  return {
    id: `editor.keybindings.${subcategory}.${key}`,
    label,
    category: `editor.keybindings.${subcategory}`,
    type: 'keybinding',
    default: defaultValue,
  };
}

export const keybindingSettings: SettingDefinition[] = [
  // Global
  kb('global', 'focusCanvas', 'Focus Canvas', defaultKeybindings.global.focusCanvas),
  kb('global', 'focusTimeline', 'Focus Timeline', defaultKeybindings.global.focusTimeline),
  kb('global', 'focusPreview', 'Focus Preview', defaultKeybindings.global.focusPreview),
  kb('global', 'focusNavigator', 'Focus Navigator', defaultKeybindings.global.focusNavigator),
  kb('global', 'hideCanvas', 'Toggle Hide Canvas', defaultKeybindings.global.hideCanvas),
  kb('global', 'hideTimeline', 'Toggle Hide Timeline', defaultKeybindings.global.hideTimeline),
  kb('global', 'hidePreview', 'Toggle Hide Preview', defaultKeybindings.global.hidePreview),
  kb('global', 'hideNavigator', 'Toggle Hide Navigator', defaultKeybindings.global.hideNavigator),
  kb('global', 'fullscreenCanvas', 'Fullscreen Canvas', defaultKeybindings.global.fullscreenCanvas),
  kb('global', 'fullscreenTimeline', 'Fullscreen Timeline', defaultKeybindings.global.fullscreenTimeline),
  kb('global', 'fullscreenPreview', 'Fullscreen Preview', defaultKeybindings.global.fullscreenPreview),
  kb('global', 'fullscreenNavigator', 'Fullscreen Navigator', defaultKeybindings.global.fullscreenNavigator),
  kb('global', 'saveProject', 'Save Project', defaultKeybindings.global.saveProject),
  kb('global', 'saveProjectWithoutTask', 'Save Without Task', defaultKeybindings.global.saveProjectWithoutTask),
  kb('global', 'openProject', 'Open Project', defaultKeybindings.global.openProject),
  kb('global', 'newProject', 'New Project', defaultKeybindings.global.newProject),
  kb('global', 'undo', 'Undo', defaultKeybindings.global.undo),
  kb('global', 'redo', 'Redo', defaultKeybindings.global.redo),
  kb('global', 'openCommandPalette', 'Command Palette', defaultKeybindings.global.openCommandPalette),
  kb('global', 'saveLayout', 'Save Layout', defaultKeybindings.global.saveLayout),
  kb('global', 'manageLayouts', 'Manage Layouts', defaultKeybindings.global.manageLayouts),
  kb('global', 'resetLayout', 'Reset Layout', defaultKeybindings.global.resetLayout),
  kb('global', 'openWiki', 'Open Wiki', defaultKeybindings.global.openWiki),

  // Canvas
  kb('canvas', 'toolPencil', 'Pencil Tool', defaultKeybindings.canvas.toolPencil),
  kb('canvas', 'toolEraser', 'Eraser Tool', defaultKeybindings.canvas.toolEraser),
  kb('canvas', 'toolFill', 'Fill Tool', defaultKeybindings.canvas.toolFill),
  kb('canvas', 'toolPicker', 'Color Picker Tool', defaultKeybindings.canvas.toolPicker),
  kb('canvas', 'toolMove', 'Move Tool', defaultKeybindings.canvas.toolMove),
  kb('canvas', 'toolPan', 'Pan Tool', defaultKeybindings.canvas.toolPan),
  kb('canvas', 'toolScale', 'Scale Tool', defaultKeybindings.canvas.toolScale),
  kb('canvas', 'toolRotate', 'Rotate Tool', defaultKeybindings.canvas.toolRotate),
  kb('canvas', 'toolTransform', 'Transform Tool', defaultKeybindings.canvas.toolTransform),
  kb('canvas', 'toolSelection', 'Selection Tool', defaultKeybindings.canvas.toolSelection),
  kb('canvas', 'toolMagicWand', 'Magic Wand Tool', defaultKeybindings.canvas.toolMagicWand),
  kb('canvas', 'toolLine', 'Line Tool', defaultKeybindings.canvas.toolLine),
  kb('canvas', 'toolRectangle', 'Rectangle Tool', defaultKeybindings.canvas.toolRectangle),
  kb('canvas', 'toolEllipse', 'Ellipse Tool', defaultKeybindings.canvas.toolEllipse),
  kb('canvas', 'flipHorizontal', 'Flip Horizontal', defaultKeybindings.canvas.flipHorizontal),
  kb('canvas', 'flipVertical', 'Flip Vertical', defaultKeybindings.canvas.flipVertical),
  kb('canvas', 'rotateCw', 'Rotate Clockwise', defaultKeybindings.canvas.rotateCw),
  kb('canvas', 'rotateCcw', 'Rotate Counter-Clockwise', defaultKeybindings.canvas.rotateCcw),
  kb('canvas', 'selectAll', 'Select All', defaultKeybindings.canvas.selectAll),
  kb('canvas', 'clearSelection', 'Clear Selection', defaultKeybindings.canvas.clearSelection),
  kb('canvas', 'zoomIn', 'Zoom In', defaultKeybindings.canvas.zoomIn),
  kb('canvas', 'zoomOut', 'Zoom Out', defaultKeybindings.canvas.zoomOut),
  kb('canvas', 'zoomReset', 'Zoom Reset', defaultKeybindings.canvas.zoomReset),
  kb('canvas', 'fitToScreen', 'Fit to Screen', defaultKeybindings.canvas.fitToScreen),
  kb('canvas', 'zoomToSelection', 'Zoom to Selection', defaultKeybindings.canvas.zoomToSelection),
  kb('canvas', 'toggleGrid', 'Toggle Grid', defaultKeybindings.canvas.toggleGrid),
  kb('canvas', 'toggleCenterLines', 'Toggle Center Lines', defaultKeybindings.canvas.toggleCenterLines),
  kb('canvas', 'copy', 'Copy', defaultKeybindings.canvas.copy),
  kb('canvas', 'paste', 'Paste', defaultKeybindings.canvas.paste),
  kb('canvas', 'swapColors', 'Swap Colors', defaultKeybindings.canvas.swapColors),

  // Timeline (includes keyframe editing)
  kb('timeline', 'playPause', 'Play / Pause', defaultKeybindings.timeline.playPause),
  kb('timeline', 'stop', 'Stop', defaultKeybindings.timeline.stop),
  kb('timeline', 'nextFrame', 'Next Frame', defaultKeybindings.timeline.nextFrame),
  kb('timeline', 'prevFrame', 'Previous Frame', defaultKeybindings.timeline.prevFrame),
  kb('timeline', 'stepForward', 'Step Forward', defaultKeybindings.timeline.stepForward),
  kb('timeline', 'stepBackward', 'Step Backward', defaultKeybindings.timeline.stepBackward),
  kb('timeline', 'toggleLoopMode', 'Toggle Loop Mode', defaultKeybindings.timeline.toggleLoopMode),
  kb('timeline', 'addKeyframe', 'Add Keyframe', defaultKeybindings.timeline.addKeyframe),
  kb('timeline', 'deleteKeyframe', 'Delete Keyframe', defaultKeybindings.timeline.deleteKeyframe),
  kb('timeline', 'duplicateKeyframe', 'Duplicate Keyframe', defaultKeybindings.timeline.duplicateKeyframe),

  // Navigator
  kb('navigator', 'newFrame', 'New Frame', defaultKeybindings.navigator.newFrame),
  kb('navigator', 'deleteFrame', 'Delete Frame', defaultKeybindings.navigator.deleteFrame),
  kb('navigator', 'duplicateFrame', 'Duplicate Frame', defaultKeybindings.navigator.duplicateFrame),
  kb('navigator', 'newLayer', 'New Layer', defaultKeybindings.navigator.newLayer),
  kb('navigator', 'deleteLayer', 'Delete Layer', defaultKeybindings.navigator.deleteLayer),
];
