import { AppProject } from '../types/project';

export interface ChangeTracker {
  dirtySpritesheets: Set<string>;
  dirtyAnimations: Map<string, string>; // animation ID → spritesheet ID
  dirtyFrames: Map<string, string>; // frame ID → spritesheet ID
  dirtyLayers: Map<string, { frameId: string; spritesheetId: string }>;
  deletedSpritesheets: Set<string>;
  deletedAnimations: Map<string, string>; // animation ID → spritesheet ID
  deletedFrames: Map<string, string>; // frame ID → spritesheet ID
  deletedLayers: Map<string, { frameId: string; spritesheetId: string }>;
  deletedPalettes: Set<string>;
  deletedImages: Map<string, string>; // image ID → spritesheet ID
  structuralChanges: string[];
  projectDirty: boolean;
  fullSave: boolean; // true for first save / migration — writes everything
}

export function createChangeTracker(fullSave = false): ChangeTracker {
  return {
    dirtySpritesheets: new Set(),
    dirtyAnimations: new Map(),
    dirtyFrames: new Map(),
    dirtyLayers: new Map(),
    deletedSpritesheets: new Set(),
    deletedAnimations: new Map(),
    deletedFrames: new Map(),
    deletedLayers: new Map(),
    deletedPalettes: new Set(),
    deletedImages: new Map(),
    structuralChanges: [],
    projectDirty: fullSave,
    fullSave,
  };
}

export function markSpritesheetDirty(tracker: ChangeTracker, sheetId: string) {
  tracker.dirtySpritesheets.add(sheetId);
}

export function markAnimationDirty(tracker: ChangeTracker, animId: string, sheetId: string) {
  tracker.dirtyAnimations.set(animId, sheetId);
  tracker.dirtySpritesheets.add(sheetId);
}

export function markFrameDirty(tracker: ChangeTracker, frameId: string, sheetId: string) {
  tracker.dirtyFrames.set(frameId, sheetId);
  tracker.dirtySpritesheets.add(sheetId);
}

export function markLayerDirty(
  tracker: ChangeTracker,
  layerId: string,
  frameId: string,
  sheetId: string,
) {
  tracker.dirtyLayers.set(layerId, { frameId, spritesheetId: sheetId });
  tracker.dirtyFrames.set(frameId, sheetId);
  tracker.dirtySpritesheets.add(sheetId);
}

/**
 * Build a descriptive commit message from the current change tracker state.
 */
export function buildCommitMessage(tracker: ChangeTracker, project: AppProject): string {
  // 1. Structural changes take priority
  if (tracker.structuralChanges.length > 0) {
    return tracker.structuralChanges.join('\n');
  }

  const sheetNames = (ids: Set<string>): string[] => {
    return [...ids]
      .map((id) => project.spritesheets.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];
  };

  // 2. Single or multiple dirty spritesheets
  const dirtySheetIds = tracker.dirtySpritesheets;
  if (dirtySheetIds.size === 1) {
    const names = sheetNames(dirtySheetIds);
    if (names.length === 1) {
      // Check if a single animation was dirty for a more specific message
      if (tracker.dirtyAnimations.size === 1 && tracker.dirtyFrames.size === 0 && tracker.dirtyLayers.size === 0) {
        const [animId] = tracker.dirtyAnimations.keys();
        const sheet = project.spritesheets.find((s) => s.id === [...dirtySheetIds][0]);
        const anim = sheet?.animations.find((a) => a.id === animId);
        if (anim) {
          return `Work on Animation '${anim.name}' in '${names[0]}'`;
        }
      }
      return `Work on Spritesheet '${names[0]}'`;
    }
  }

  if (dirtySheetIds.size > 1) {
    const names = sheetNames(dirtySheetIds);
    if (names.length > 0) {
      return `Work on Spritesheets ${names.map((n) => `'${n}'`).join(', ')}`;
    }
  }

  // 3. Project-level changes only
  if (tracker.projectDirty) {
    return 'Update project settings';
  }

  return 'Save project';
}

/**
 * Build the save manifest JSON from the project and change tracker.
 * If fullSave is true, includes all data (for first save or migration).
 */
export function buildSaveManifest(project: AppProject, tracker: ChangeTracker): string {
  const isFullSave = tracker.fullSave;

  const manifest: any = {
    project: {
      id: project.id,
      name: project.name,
      defaultCanvasSize: project.defaultCanvasSize,
    },
    palettes: project.palettes,
    deleted_palettes: [...tracker.deletedPalettes],
    deleted_spritesheets: [...tracker.deletedSpritesheets],
    write_gitignore: true,
    spritesheets: [] as any[],
  };

  for (const sheet of project.spritesheets) {
    // Skip unchanged spritesheets unless full save
    if (!isFullSave && !tracker.dirtySpritesheets.has(sheet.id)) {
      continue;
    }

    const sheetManifest: any = {
      id: sheet.id,
      name: sheet.name,
      deleted_animations: [...tracker.deletedAnimations.entries()]
        .filter(([, sid]) => sid === sheet.id)
        .map(([aid]) => aid),
      deleted_frames: [...tracker.deletedFrames.entries()]
        .filter(([, sid]) => sid === sheet.id)
        .map(([fid]) => fid),
      deleted_images: [...tracker.deletedImages.entries()]
        .filter(([, sid]) => sid === sheet.id)
        .map(([iid]) => iid),
      animations: [] as any[],
      images: [] as any[],
      frames: [] as any[],
    };

    // Include animations that are dirty or all if full save
    for (const anim of sheet.animations) {
      if (isFullSave || tracker.dirtyAnimations.has(anim.id)) {
        sheetManifest.animations.push(anim);
      }
    }

    // Include images (always write all for dirty spritesheets)
    if (isFullSave || tracker.dirtySpritesheets.has(sheet.id)) {
      sheetManifest.images = sheet.images || [];
    }

    // Include frames that are dirty or all if full save
    for (const frame of sheet.frames) {
      if (isFullSave || tracker.dirtyFrames.has(frame.id)) {
        const deletedLayers = [...tracker.deletedLayers.entries()]
          .filter(([, info]) => info.frameId === frame.id && info.spritesheetId === sheet.id)
          .map(([lid]) => lid);

        const frameLayers = [];
        for (const layer of frame.layers) {
          if (isFullSave || tracker.dirtyLayers.has(layer.id)) {
            frameLayers.push(layer);
          }
        }

        sheetManifest.frames.push({
          id: frame.id,
          layerOrder: frame.layers.map((l) => l.id),
          layers: frameLayers,
          deleted_layers: deletedLayers,
        });
      }
    }

    manifest.spritesheets.push(sheetManifest);
  }

  return JSON.stringify(manifest);
}
