import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useEditorStore } from '../store/editorStore';
import { defaultKeybindings, KeybindingsConfig } from '../config/keybindings';

/**
 * Reads keybinding values from the settings store and pushes them
 * into editorStore.keybindings so the hotkey hooks pick them up.
 */
export function useKeybindingsFromSettings() {
  const values = useSettingsStore((s) => s.values);
  const setKeybindings = useEditorStore((s) => s.setKeybindings);

  useEffect(() => {
    function get(id: string, fallback: string): string {
      const v = values[id];
      return typeof v === 'string' && v ? v : fallback;
    }

    const config: KeybindingsConfig = {
      global: {
        focusCanvas: get('editor.keybindings.global.focusCanvas', defaultKeybindings.global.focusCanvas),
        focusTimeline: get('editor.keybindings.global.focusTimeline', defaultKeybindings.global.focusTimeline),
        focusPreview: get('editor.keybindings.global.focusPreview', defaultKeybindings.global.focusPreview),
        focusNavigator: get('editor.keybindings.global.focusNavigator', defaultKeybindings.global.focusNavigator),
        hideCanvas: get('editor.keybindings.global.hideCanvas', defaultKeybindings.global.hideCanvas),
        hideTimeline: get('editor.keybindings.global.hideTimeline', defaultKeybindings.global.hideTimeline),
        hidePreview: get('editor.keybindings.global.hidePreview', defaultKeybindings.global.hidePreview),
        hideNavigator: get('editor.keybindings.global.hideNavigator', defaultKeybindings.global.hideNavigator),
        fullscreenCanvas: get('editor.keybindings.global.fullscreenCanvas', defaultKeybindings.global.fullscreenCanvas),
        fullscreenTimeline: get('editor.keybindings.global.fullscreenTimeline', defaultKeybindings.global.fullscreenTimeline),
        fullscreenPreview: get('editor.keybindings.global.fullscreenPreview', defaultKeybindings.global.fullscreenPreview),
        fullscreenNavigator: get('editor.keybindings.global.fullscreenNavigator', defaultKeybindings.global.fullscreenNavigator),
        saveProject: get('editor.keybindings.global.saveProject', defaultKeybindings.global.saveProject),
        saveProjectWithoutTask: get('editor.keybindings.global.saveProjectWithoutTask', defaultKeybindings.global.saveProjectWithoutTask),
        openProject: get('editor.keybindings.global.openProject', defaultKeybindings.global.openProject),
        newProject: get('editor.keybindings.global.newProject', defaultKeybindings.global.newProject),
        undo: get('editor.keybindings.global.undo', defaultKeybindings.global.undo),
        redo: get('editor.keybindings.global.redo', defaultKeybindings.global.redo),
        openCommandPalette: get('editor.keybindings.global.openCommandPalette', defaultKeybindings.global.openCommandPalette),
        saveLayout: get('editor.keybindings.global.saveLayout', defaultKeybindings.global.saveLayout),
        manageLayouts: get('editor.keybindings.global.manageLayouts', defaultKeybindings.global.manageLayouts),
        resetLayout: get('editor.keybindings.global.resetLayout', defaultKeybindings.global.resetLayout),
      },
      canvas: {
        toolPencil: get('editor.keybindings.canvas.toolPencil', defaultKeybindings.canvas.toolPencil),
        toolEraser: get('editor.keybindings.canvas.toolEraser', defaultKeybindings.canvas.toolEraser),
        toolFill: get('editor.keybindings.canvas.toolFill', defaultKeybindings.canvas.toolFill),
        toolPicker: get('editor.keybindings.canvas.toolPicker', defaultKeybindings.canvas.toolPicker),
        toolMove: get('editor.keybindings.canvas.toolMove', defaultKeybindings.canvas.toolMove),
        toolSelection: get('editor.keybindings.canvas.toolSelection', defaultKeybindings.canvas.toolSelection),
        toolMagicWand: get('editor.keybindings.canvas.toolMagicWand', defaultKeybindings.canvas.toolMagicWand),
        toolLine: get('editor.keybindings.canvas.toolLine', defaultKeybindings.canvas.toolLine),
        toolRectangle: get('editor.keybindings.canvas.toolRectangle', defaultKeybindings.canvas.toolRectangle),
        toolEllipse: get('editor.keybindings.canvas.toolEllipse', defaultKeybindings.canvas.toolEllipse),
        flipHorizontal: get('editor.keybindings.canvas.flipHorizontal', defaultKeybindings.canvas.flipHorizontal),
        flipVertical: get('editor.keybindings.canvas.flipVertical', defaultKeybindings.canvas.flipVertical),
        rotateCw: get('editor.keybindings.canvas.rotateCw', defaultKeybindings.canvas.rotateCw),
        rotateCcw: get('editor.keybindings.canvas.rotateCcw', defaultKeybindings.canvas.rotateCcw),
        selectAll: get('editor.keybindings.canvas.selectAll', defaultKeybindings.canvas.selectAll),
        clearSelection: get('editor.keybindings.canvas.clearSelection', defaultKeybindings.canvas.clearSelection),
        zoomIn: get('editor.keybindings.canvas.zoomIn', defaultKeybindings.canvas.zoomIn),
        zoomOut: get('editor.keybindings.canvas.zoomOut', defaultKeybindings.canvas.zoomOut),
        zoomReset: get('editor.keybindings.canvas.zoomReset', defaultKeybindings.canvas.zoomReset),
        fitToScreen: get('editor.keybindings.canvas.fitToScreen', defaultKeybindings.canvas.fitToScreen),
        zoomToSelection: get('editor.keybindings.canvas.zoomToSelection', defaultKeybindings.canvas.zoomToSelection),
        toggleGrid: get('editor.keybindings.canvas.toggleGrid', defaultKeybindings.canvas.toggleGrid),
        toggleCenterLines: get('editor.keybindings.canvas.toggleCenterLines', defaultKeybindings.canvas.toggleCenterLines),
        copy: get('editor.keybindings.canvas.copy', defaultKeybindings.canvas.copy),
        paste: get('editor.keybindings.canvas.paste', defaultKeybindings.canvas.paste),
        swapColors: get('editor.keybindings.canvas.swapColors', defaultKeybindings.canvas.swapColors),
      },
      timeline: {
        playPause: get('editor.keybindings.timeline.playPause', defaultKeybindings.timeline.playPause),
        stop: get('editor.keybindings.timeline.stop', defaultKeybindings.timeline.stop),
        nextFrame: get('editor.keybindings.timeline.nextFrame', defaultKeybindings.timeline.nextFrame),
        prevFrame: get('editor.keybindings.timeline.prevFrame', defaultKeybindings.timeline.prevFrame),
        stepForward: get('editor.keybindings.timeline.stepForward', defaultKeybindings.timeline.stepForward),
        stepBackward: get('editor.keybindings.timeline.stepBackward', defaultKeybindings.timeline.stepBackward),
        toggleLoopMode: get('editor.keybindings.timeline.toggleLoopMode', defaultKeybindings.timeline.toggleLoopMode),
        addKeyframe: get('editor.keybindings.timeline.addKeyframe', defaultKeybindings.timeline.addKeyframe),
        deleteKeyframe: get('editor.keybindings.timeline.deleteKeyframe', defaultKeybindings.timeline.deleteKeyframe),
        duplicateKeyframe: get('editor.keybindings.timeline.duplicateKeyframe', defaultKeybindings.timeline.duplicateKeyframe),
      },
      navigator: {
        newFrame: get('editor.keybindings.navigator.newFrame', defaultKeybindings.navigator.newFrame),
        deleteFrame: get('editor.keybindings.navigator.deleteFrame', defaultKeybindings.navigator.deleteFrame),
        duplicateFrame: get('editor.keybindings.navigator.duplicateFrame', defaultKeybindings.navigator.duplicateFrame),
        newLayer: get('editor.keybindings.navigator.newLayer', defaultKeybindings.navigator.newLayer),
        deleteLayer: get('editor.keybindings.navigator.deleteLayer', defaultKeybindings.navigator.deleteLayer),
      },
    };

    setKeybindings(config);
  }, [values, setKeybindings]);
}
