import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '../../store/projectStore';
import type { AppProject, Spritesheet, Layer, SpriteFrame } from '../../types/project';

function makeLayer(id: string, name: string): Layer {
  return {
    id,
    name,
    opacity: 1,
    blendMode: 'normal',
    visible: true,
    locked: false,
    isReference: false,
    data: '',
  };
}

function makeFrame(id: string, layers: Layer[] = []): SpriteFrame {
  return { id, layers };
}

function makeSpritesheet(id: string, name: string): Spritesheet {
  return {
    id,
    name,
    animations: [],
    images: [],
    frames: [makeFrame('frame-1', [makeLayer('layer-1', 'Layer 1')])],
  };
}

function makeProject(): AppProject {
  return {
    id: 'proj-1',
    name: 'Test Project',
    defaultCanvasSize: { width: 64, height: 64 },
    palettes: [{ id: 'pal-1', name: 'Default', colors: ['#000000', '#ffffff'] }],
    spritesheets: [makeSpritesheet('sheet-1', 'Sheet 1')],
  };
}

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().setProject(null);
  });

  describe('setProject', () => {
    it('sets and clears project', () => {
      const project = makeProject();
      useProjectStore.getState().setProject(project);
      expect(useProjectStore.getState().project).toEqual(project);

      useProjectStore.getState().setProject(null);
      expect(useProjectStore.getState().project).toBeNull();
    });

    it('resets change tracker on setProject', () => {
      useProjectStore.getState().setProject(makeProject());
      const tracker = useProjectStore.getState().changeTracker;
      expect(tracker.dirtySpritesheets.size).toBe(0);
    });
  });

  describe('spritesheets', () => {
    beforeEach(() => {
      useProjectStore.getState().setProject(makeProject());
    });

    it('adds a spritesheet', () => {
      useProjectStore.getState().addSpritesheet(makeSpritesheet('sheet-2', 'Sheet 2'));
      expect(useProjectStore.getState().project!.spritesheets).toHaveLength(2);
    });

    it('removes a spritesheet', () => {
      useProjectStore.getState().removeSpritesheet('sheet-1');
      expect(useProjectStore.getState().project!.spritesheets).toHaveLength(0);
    });

    it('updates a spritesheet', () => {
      useProjectStore.getState().updateSpritesheet('sheet-1', { name: 'Renamed' });
      expect(useProjectStore.getState().project!.spritesheets[0].name).toBe('Renamed');
    });

    it('marks tracker dirty on add', () => {
      useProjectStore.getState().addSpritesheet(makeSpritesheet('sheet-2', 'S2'));
      const tracker = useProjectStore.getState().changeTracker;
      expect(tracker.dirtySpritesheets.has('sheet-2')).toBe(true);
    });
  });

  describe('animations', () => {
    beforeEach(() => {
      useProjectStore.getState().setProject(makeProject());
    });

    it('adds an animation', () => {
      useProjectStore.getState().addAnimation('sheet-1', {
        id: 'anim-1',
        name: 'Walk',
        keyframes: [],
      });
      const anims = useProjectStore.getState().project!.spritesheets[0].animations;
      expect(anims).toHaveLength(1);
      expect(anims[0].name).toBe('Walk');
    });

    it('removes an animation', () => {
      useProjectStore.getState().addAnimation('sheet-1', {
        id: 'anim-1',
        name: 'Walk',
        keyframes: [],
      });
      useProjectStore.getState().removeAnimation('sheet-1', 'anim-1');
      expect(useProjectStore.getState().project!.spritesheets[0].animations).toHaveLength(0);
    });

    it('updates an animation', () => {
      useProjectStore.getState().addAnimation('sheet-1', {
        id: 'anim-1',
        name: 'Walk',
        keyframes: [],
      });
      useProjectStore.getState().updateAnimation('sheet-1', 'anim-1', { name: 'Run' });
      expect(useProjectStore.getState().project!.spritesheets[0].animations[0].name).toBe('Run');
    });
  });

  describe('frames and layers', () => {
    beforeEach(() => {
      useProjectStore.getState().setProject(makeProject());
    });

    it('adds a frame', () => {
      useProjectStore.getState().addFrame('sheet-1', makeFrame('frame-2'));
      expect(useProjectStore.getState().project!.spritesheets[0].frames).toHaveLength(2);
    });

    it('adds a layer to a frame', () => {
      useProjectStore.getState().addLayer('sheet-1', 'frame-1', makeLayer('layer-2', 'Layer 2'));
      const layers = useProjectStore.getState().project!.spritesheets[0].frames[0].layers;
      expect(layers).toHaveLength(2);
    });

    it('removes a layer', () => {
      useProjectStore.getState().removeLayer('sheet-1', 'frame-1', 'layer-1');
      const layers = useProjectStore.getState().project!.spritesheets[0].frames[0].layers;
      expect(layers).toHaveLength(0);
    });

    it('updates a layer', () => {
      useProjectStore.getState().updateLayer('sheet-1', 'frame-1', 'layer-1', { opacity: 0.5 });
      const layer = useProjectStore.getState().project!.spritesheets[0].frames[0].layers[0];
      expect(layer.opacity).toBe(0.5);
    });

    it('reorders layers', () => {
      useProjectStore.getState().addLayer('sheet-1', 'frame-1', makeLayer('layer-2', 'Layer 2'));
      useProjectStore.getState().reorderLayers('sheet-1', 'frame-1', 0, 1);
      const layers = useProjectStore.getState().project!.spritesheets[0].frames[0].layers;
      expect(layers[0].id).toBe('layer-2');
      expect(layers[1].id).toBe('layer-1');
    });
  });

  describe('palettes', () => {
    beforeEach(() => {
      useProjectStore.getState().setProject(makeProject());
    });

    it('adds a palette', () => {
      useProjectStore.getState().addPalette({ id: 'pal-2', name: 'Warm', colors: ['#ff0000'] });
      expect(useProjectStore.getState().project!.palettes).toHaveLength(2);
    });

    it('removes a palette', () => {
      useProjectStore.getState().removePalette('pal-1');
      expect(useProjectStore.getState().project!.palettes).toHaveLength(0);
    });

    it('updates a palette', () => {
      useProjectStore.getState().updatePalette('pal-1', { name: 'Renamed Palette' });
      expect(useProjectStore.getState().project!.palettes[0].name).toBe('Renamed Palette');
    });

    it('adds a color to palette', () => {
      useProjectStore.getState().addColorToPalette('pal-1', '#ff0000');
      expect(useProjectStore.getState().project!.palettes[0].colors).toContain('#ff0000');
    });

    it('removes a color from palette', () => {
      useProjectStore.getState().removeColorFromPalette('pal-1', 0);
      expect(useProjectStore.getState().project!.palettes[0].colors).toHaveLength(1);
      expect(useProjectStore.getState().project!.palettes[0].colors[0]).toBe('#ffffff');
    });
  });

  describe('active selection', () => {
    beforeEach(() => {
      useProjectStore.getState().setProject(makeProject());
    });

    it('sets active spritesheet and clears children', () => {
      useProjectStore.getState().setActiveFrame('frame-1');
      useProjectStore.getState().setActiveSpritesheet('sheet-1');
      expect(useProjectStore.getState().activeSpritesheetId).toBe('sheet-1');
      expect(useProjectStore.getState().activeFrameId).toBeNull();
    });

    it('sets active frame', () => {
      useProjectStore.getState().setActiveFrame('frame-1');
      expect(useProjectStore.getState().activeFrameId).toBe('frame-1');
    });

    it('sets active layer', () => {
      useProjectStore.getState().setActiveLayer('layer-1');
      expect(useProjectStore.getState().activeLayerId).toBe('layer-1');
    });
  });

  describe('no-op when project is null', () => {
    it('addSpritesheet does nothing without project', () => {
      useProjectStore.getState().addSpritesheet(makeSpritesheet('x', 'X'));
      expect(useProjectStore.getState().project).toBeNull();
    });

    it('addLayer does nothing without project', () => {
      useProjectStore.getState().addLayer('x', 'y', makeLayer('z', 'Z'));
      expect(useProjectStore.getState().project).toBeNull();
    });
  });
});
