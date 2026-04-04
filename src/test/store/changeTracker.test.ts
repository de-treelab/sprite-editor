import { describe, it, expect } from 'vitest';
import {
  createChangeTracker,
  markSpritesheetDirty,
  markAnimationDirty,
  markFrameDirty,
  markLayerDirty,
  buildCommitMessage,
  buildSaveManifest,
} from '../../store/changeTracker';
import type { AppProject } from '../../types/project';

function makeProject(overrides?: Partial<AppProject>): AppProject {
  return {
    id: 'proj-1',
    name: 'Test Project',
    defaultCanvasSize: { width: 32, height: 32 },
    palettes: [],
    spritesheets: [
      {
        id: 'sheet-1',
        name: 'Main',
        animations: [
          { id: 'anim-1', name: 'Idle', keyframes: [] },
          { id: 'anim-2', name: 'Walk', keyframes: [] },
        ],
        images: [],
        frames: [
          {
            id: 'frame-1',
            layers: [
              {
                id: 'layer-1',
                name: 'Layer 1',
                opacity: 1,
                blendMode: 'normal',
                visible: true,
                locked: false,
                isReference: false,
                data: '',
              },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('createChangeTracker', () => {
  it('creates empty tracker', () => {
    const tracker = createChangeTracker();
    expect(tracker.dirtySpritesheets.size).toBe(0);
    expect(tracker.fullSave).toBe(false);
    expect(tracker.projectDirty).toBe(false);
  });

  it('creates fullSave tracker', () => {
    const tracker = createChangeTracker(true);
    expect(tracker.fullSave).toBe(true);
    expect(tracker.projectDirty).toBe(true);
  });
});

describe('marking functions', () => {
  it('markSpritesheetDirty adds sheet id', () => {
    const tracker = createChangeTracker();
    markSpritesheetDirty(tracker, 'sheet-1');
    expect(tracker.dirtySpritesheets.has('sheet-1')).toBe(true);
  });

  it('markAnimationDirty also marks parent sheet', () => {
    const tracker = createChangeTracker();
    markAnimationDirty(tracker, 'anim-1', 'sheet-1');
    expect(tracker.dirtyAnimations.get('anim-1')).toBe('sheet-1');
    expect(tracker.dirtySpritesheets.has('sheet-1')).toBe(true);
  });

  it('markFrameDirty also marks parent sheet', () => {
    const tracker = createChangeTracker();
    markFrameDirty(tracker, 'frame-1', 'sheet-1');
    expect(tracker.dirtyFrames.get('frame-1')).toBe('sheet-1');
    expect(tracker.dirtySpritesheets.has('sheet-1')).toBe(true);
  });

  it('markLayerDirty cascades up', () => {
    const tracker = createChangeTracker();
    markLayerDirty(tracker, 'layer-1', 'frame-1', 'sheet-1');
    expect(tracker.dirtyLayers.has('layer-1')).toBe(true);
    expect(tracker.dirtyFrames.has('frame-1')).toBe(true);
    expect(tracker.dirtySpritesheets.has('sheet-1')).toBe(true);
  });
});

describe('buildCommitMessage', () => {
  it('uses structural changes when present', () => {
    const tracker = createChangeTracker();
    tracker.structuralChanges.push("Add Spritesheet 'Player'");
    const project = makeProject();
    expect(buildCommitMessage(tracker, project)).toBe("Add Spritesheet 'Player'");
  });

  it('generates spritesheet-level message for single dirty sheet', () => {
    const tracker = createChangeTracker();
    markSpritesheetDirty(tracker, 'sheet-1');
    const project = makeProject();
    expect(buildCommitMessage(tracker, project)).toBe("Work on Spritesheet 'Main'");
  });

  it('generates animation-specific message for single dirty animation', () => {
    const tracker = createChangeTracker();
    markAnimationDirty(tracker, 'anim-1', 'sheet-1');
    const project = makeProject();
    expect(buildCommitMessage(tracker, project)).toBe("Work on Animation 'Idle' in 'Main'");
  });

  it('generates multi-sheet message', () => {
    const project = makeProject({
      spritesheets: [
        {
          id: 'sheet-1',
          name: 'Main',
          animations: [],
          images: [],
          frames: [],
        },
        {
          id: 'sheet-2',
          name: 'Enemies',
          animations: [],
          images: [],
          frames: [],
        },
      ],
    });
    const tracker = createChangeTracker();
    markSpritesheetDirty(tracker, 'sheet-1');
    markSpritesheetDirty(tracker, 'sheet-2');
    const msg = buildCommitMessage(tracker, project);
    expect(msg).toContain('Main');
    expect(msg).toContain('Enemies');
  });

  it("defaults to 'Save project' when nothing specific", () => {
    const tracker = createChangeTracker();
    const project = makeProject();
    expect(buildCommitMessage(tracker, project)).toBe('Save project');
  });

  it("returns 'Update project settings' for project-only changes", () => {
    const tracker = createChangeTracker();
    tracker.projectDirty = true;
    const project = makeProject();
    expect(buildCommitMessage(tracker, project)).toBe('Update project settings');
  });
});

describe('buildSaveManifest', () => {
  it('produces valid JSON', () => {
    const project = makeProject();
    const tracker = createChangeTracker(true);
    const json = buildSaveManifest(project, tracker);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes all spritesheets on fullSave', () => {
    const project = makeProject();
    const tracker = createChangeTracker(true);
    const manifest = JSON.parse(buildSaveManifest(project, tracker));
    expect(manifest.spritesheets).toHaveLength(1);
    expect(manifest.spritesheets[0].id).toBe('sheet-1');
  });

  it('excludes unchanged spritesheets on incremental save', () => {
    const project = makeProject();
    const tracker = createChangeTracker();
    // Don't mark anything dirty
    const manifest = JSON.parse(buildSaveManifest(project, tracker));
    expect(manifest.spritesheets).toHaveLength(0);
  });

  it('includes dirty spritesheet on incremental save', () => {
    const project = makeProject();
    const tracker = createChangeTracker();
    markLayerDirty(tracker, 'layer-1', 'frame-1', 'sheet-1');
    const manifest = JSON.parse(buildSaveManifest(project, tracker));
    expect(manifest.spritesheets).toHaveLength(1);
    expect(manifest.spritesheets[0].frames).toHaveLength(1);
    expect(manifest.spritesheets[0].frames[0].layers).toHaveLength(1);
  });

  it('includes deleted items', () => {
    const project = makeProject();
    const tracker = createChangeTracker();
    tracker.deletedSpritesheets.add('deleted-sheet');
    tracker.deletedPalettes.add('deleted-palette');
    const manifest = JSON.parse(buildSaveManifest(project, tracker));
    expect(manifest.deleted_spritesheets).toContain('deleted-sheet');
    expect(manifest.deleted_palettes).toContain('deleted-palette');
  });

  it('includes project metadata', () => {
    const project = makeProject();
    const tracker = createChangeTracker(true);
    const manifest = JSON.parse(buildSaveManifest(project, tracker));
    expect(manifest.project.id).toBe('proj-1');
    expect(manifest.project.name).toBe('Test Project');
    expect(manifest.project.defaultCanvasSize).toEqual({
      width: 32,
      height: 32,
    });
  });
});
