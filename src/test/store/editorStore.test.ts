import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '../../store/editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    // Reset to defaults
    const store = useEditorStore.getState();
    store.setActiveTool('pencil');
    store.setPrimaryColor('#000000');
    store.setSecondaryColor('#ffffff');
    store.setZoomLevel(100);
    store.setFocusedView(null);
    store.setOnionSkinEnabled(false);
    store.setShowGrid(false);
    store.setShowCenterLines(false);
    store.setClipboard(null);
    store.setSelectionMask(null);
    store.setIsPlaying(false);
    store.setLoopMode('loop');
  });

  describe('tool switching', () => {
    it('defaults to pencil', () => {
      expect(useEditorStore.getState().activeTool).toBe('pencil');
    });

    it('sets active tool', () => {
      useEditorStore.getState().setActiveTool('eraser');
      expect(useEditorStore.getState().activeTool).toBe('eraser');
    });
  });

  describe('colors', () => {
    it('sets primary color', () => {
      useEditorStore.getState().setPrimaryColor('#ff0000');
      expect(useEditorStore.getState().primaryColor).toBe('#ff0000');
    });

    it('sets secondary color', () => {
      useEditorStore.getState().setSecondaryColor('#00ff00');
      expect(useEditorStore.getState().secondaryColor).toBe('#00ff00');
    });
  });

  describe('zoom', () => {
    it('sets zoom level', () => {
      useEditorStore.getState().setZoomLevel(200);
      expect(useEditorStore.getState().zoomLevel).toBe(200);
    });
  });

  describe('view toggling', () => {
    it('toggles hidden view', () => {
      useEditorStore.getState().toggleHiddenView('canvas');
      expect(useEditorStore.getState().hiddenViews.has('canvas')).toBe(true);

      useEditorStore.getState().toggleHiddenView('canvas');
      expect(useEditorStore.getState().hiddenViews.has('canvas')).toBe(false);
    });

    it('toggles fullscreen view', () => {
      useEditorStore.getState().toggleFullscreenView('canvas');
      expect(useEditorStore.getState().fullscreenView).toBe('canvas');

      useEditorStore.getState().toggleFullscreenView('canvas');
      expect(useEditorStore.getState().fullscreenView).toBeNull();
    });

    it('hiding fullscreen view clears fullscreen', () => {
      useEditorStore.getState().toggleFullscreenView('canvas');
      useEditorStore.getState().toggleHiddenView('canvas');
      expect(useEditorStore.getState().fullscreenView).toBeNull();
    });
  });

  describe('onion skin', () => {
    it('toggles onion skin enabled', () => {
      useEditorStore.getState().setOnionSkinEnabled(true);
      expect(useEditorStore.getState().onionSkinEnabled).toBe(true);
    });

    it('sets onion skin parameters', () => {
      useEditorStore.getState().setOnionSkinBefore(3);
      useEditorStore.getState().setOnionSkinAfter(2);
      useEditorStore.getState().setOnionSkinOpacity(0.5);
      expect(useEditorStore.getState().onionSkinBefore).toBe(3);
      expect(useEditorStore.getState().onionSkinAfter).toBe(2);
      expect(useEditorStore.getState().onionSkinOpacity).toBe(0.5);
    });
  });

  describe('clipboard', () => {
    it('sets clipboard data', () => {
      const clip = {
        data: 'base64data',
        width: 32,
        height: 32,
        offsetX: 0,
        offsetY: 0,
      };
      useEditorStore.getState().setClipboard(clip);
      expect(useEditorStore.getState().clipboard).toEqual(clip);
    });

    it('clears clipboard', () => {
      useEditorStore.getState().setClipboard({
        data: 'x',
        width: 1,
        height: 1,
        offsetX: 0,
        offsetY: 0,
      });
      useEditorStore.getState().setClipboard(null);
      expect(useEditorStore.getState().clipboard).toBeNull();
    });
  });

  describe('selection mask', () => {
    it('sets and clears selection mask', () => {
      const mask = new Uint8Array([0, 1, 1, 0]);
      useEditorStore.getState().setSelectionMask(mask);
      expect(useEditorStore.getState().selectionMask).toBe(mask);

      useEditorStore.getState().setSelectionMask(null);
      expect(useEditorStore.getState().selectionMask).toBeNull();
    });
  });

  describe('playback', () => {
    it('sets playing state', () => {
      useEditorStore.getState().setIsPlaying(true);
      expect(useEditorStore.getState().isPlaying).toBe(true);
    });

    it('sets loop mode', () => {
      useEditorStore.getState().setLoopMode('pingpong');
      expect(useEditorStore.getState().loopMode).toBe('pingpong');
    });

    it('sets playback speed', () => {
      useEditorStore.getState().setPlaybackSpeed(2);
      expect(useEditorStore.getState().playbackSpeed).toBe(2);
    });
  });
});
