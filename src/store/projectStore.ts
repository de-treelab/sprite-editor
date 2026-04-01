import { create } from "zustand";
import { AppProject, Spritesheet, Animation, ReferenceImage, ActiveItemType, Layer, ProjectPalette } from "../types/project";
import {
  ChangeTracker,
  createChangeTracker,
  markSpritesheetDirty,
  markAnimationDirty,
  markFrameDirty,
  markLayerDirty,
} from "./changeTracker";

interface ProjectState {
  project: AppProject | null;
  projectPath: string | null;
  changeTracker: ChangeTracker;
  activeSpritesheetId: string | null;
  activeItemId: string | null;
  activeItemType: ActiveItemType | null;
  activeFrameId: string | null;
  activeLayerId: string | null;

  setProject: (project: AppProject | null) => void;
  setProjectPath: (path: string | null) => void;
  resetChangeTracker: (fullSave?: boolean) => void;
  addSpritesheet: (sheet: Spritesheet) => void;
  removeSpritesheet: (sheetId: string) => void;
  updateSpritesheet: (sheetId: string, updates: Partial<Spritesheet>) => void;
  addAnimation: (spritesheetId: string, animation: Animation) => void;
  removeAnimation: (spritesheetId: string, animationId: string) => void;
  updateAnimation: (spritesheetId: string, animationId: string, updates: Partial<Animation>) => void;
  addImage: (spritesheetId: string, image: ReferenceImage) => void;
  removeImage: (spritesheetId: string, imageId: string) => void;
  updateImage: (spritesheetId: string, imageId: string, updates: Partial<ReferenceImage>) => void;
  setActiveSpritesheet: (sheetId: string | null) => void;
  setActiveItem: (itemId: string | null, itemType?: ActiveItemType | null) => void;
  setActiveFrame: (frameId: string | null) => void;
  setActiveLayer: (layerId: string | null) => void;
  addKeyframe: (spritesheetId: string, animationId: string, keyframe: import('../types/project').Keyframe) => void;
  updateKeyframe: (spritesheetId: string, animationId: string, keyframeId: string, updates: Partial<import('../types/project').Keyframe>) => void;
  removeKeyframe: (spritesheetId: string, animationId: string, keyframeId: string) => void;
  addFrame: (spritesheetId: string, frame: import('../types/project').SpriteFrame) => void;
  addLayer: (spritesheetId: string, frameId: string, layer: Layer) => void;
  removeLayer: (spritesheetId: string, frameId: string, layerId: string) => void;
  updateLayer: (spritesheetId: string, frameId: string, layerId: string, updates: Partial<Layer>) => void;
  reorderLayers: (spritesheetId: string, frameId: string, fromIndex: number, toIndex: number) => void;
  addPalette: (palette: ProjectPalette) => void;
  removePalette: (paletteId: string) => void;
  updatePalette: (paletteId: string, updates: Partial<ProjectPalette>) => void;
  addColorToPalette: (paletteId: string, color: string) => void;
  removeColorFromPalette: (paletteId: string, colorIndex: number) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  projectPath: null,
  changeTracker: createChangeTracker(true),
  activeSpritesheetId: null,
  activeItemId: null,
  activeItemType: null,
  activeFrameId: null,
  activeLayerId: null,

  setProject: (project) => set({ project, changeTracker: createChangeTracker(true) }),
  setProjectPath: (projectPath) => set({ projectPath }),
  resetChangeTracker: (fullSave = false) => set({ changeTracker: createChangeTracker(fullSave) }),

  addSpritesheet: (sheet) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markSpritesheetDirty(tracker, sheet.id);
      tracker.structuralChanges.push(`Add Spritesheet '${sheet.name}'`);
      return {
        changeTracker: { ...tracker },
        project: {
          ...state.project,
          spritesheets: [...state.project.spritesheets, sheet],
        },
      };
    }),

  removeSpritesheet: (sheetId) =>
    set((state) => {
      if (!state.project) return state;
      const sheet = state.project.spritesheets.find((s) => s.id === sheetId);
      const tracker = state.changeTracker;
      tracker.deletedSpritesheets.add(sheetId);
      tracker.structuralChanges.push(`Remove Spritesheet '${sheet?.name || sheetId}'`);
      return {
        changeTracker: { ...tracker },
        project: {
          ...state.project,
          spritesheets: state.project.spritesheets.filter((s) => s.id !== sheetId),
        },
      };
    }),

  updateSpritesheet: (sheetId, updates) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markSpritesheetDirty(tracker, sheetId);
      return {
        changeTracker: { ...tracker },
        project: {
          ...state.project,
          spritesheets: state.project.spritesheets.map(s => s.id === sheetId ? { ...s, ...updates } : s)
        }
      };
    }),

  addAnimation: (spritesheetId, animation) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markAnimationDirty(tracker, animation.id, spritesheetId);
      const sheetName = state.project.spritesheets.find((s) => s.id === spritesheetId)?.name || spritesheetId;
      tracker.structuralChanges.push(`Add Animation '${animation.name}' to '${sheetName}'`);
      const spritesheets = state.project.spritesheets.map((sheet) =>
        sheet.id === spritesheetId
          ? { ...sheet, animations: [...sheet.animations, animation] }
          : sheet
      );
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  removeAnimation: (spritesheetId, animationId) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      tracker.deletedAnimations.set(animationId, spritesheetId);
      markSpritesheetDirty(tracker, spritesheetId);
      const sheet = state.project.spritesheets.find((s) => s.id === spritesheetId);
      const anim = sheet?.animations.find((a) => a.id === animationId);
      tracker.structuralChanges.push(`Remove Animation '${anim?.name || animationId}' from '${sheet?.name || spritesheetId}'`);
      const spritesheets = state.project.spritesheets.map((s) => {
        if (s.id !== spritesheetId) return s;
        return { ...s, animations: s.animations.filter((a) => a.id !== animationId) };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  updateAnimation: (spritesheetId, animationId, updates) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markAnimationDirty(tracker, animationId, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
        if (sheet.id !== spritesheetId) return sheet;
        const animations = sheet.animations.map((anim) =>
          anim.id === animationId ? { ...anim, ...updates } : anim
        );
        return { ...sheet, animations };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  addImage: (spritesheetId, image) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markSpritesheetDirty(tracker, spritesheetId);
      tracker.structuralChanges.push(`Add Image '${image.name}'`);
      const spritesheets = state.project.spritesheets.map((sheet) =>
        sheet.id === spritesheetId
          ? { ...sheet, images: [...(sheet.images || []), image] }
          : sheet
      );
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  removeImage: (spritesheetId, imageId) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markSpritesheetDirty(tracker, spritesheetId);
      const sheet = state.project.spritesheets.find((s) => s.id === spritesheetId);
      const img = (sheet?.images || []).find((i) => i.id === imageId);
      tracker.structuralChanges.push(`Remove Image '${img?.name || imageId}'`);
      const spritesheets = state.project.spritesheets.map((s) => {
        if (s.id !== spritesheetId) return s;
        return { ...s, images: (s.images || []).filter((i) => i.id !== imageId) };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  updateImage: (spritesheetId, imageId, updates) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markSpritesheetDirty(tracker, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
        if (sheet.id !== spritesheetId) return sheet;
        const images = (sheet.images || []).map((img) =>
          img.id === imageId ? { ...img, ...updates } : img
        );
        return { ...sheet, images };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  setActiveSpritesheet: (sheetId) => set({ activeSpritesheetId: sheetId, activeItemId: null, activeItemType: null, activeFrameId: null, activeLayerId: null }),
  setActiveItem: (itemId, itemType = null) => set({ activeItemId: itemId, activeItemType: itemId ? (itemType ?? null) : null, activeFrameId: null, activeLayerId: null }),
  setActiveFrame: (frameId) => set({ activeFrameId: frameId }),
  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

  addKeyframe: (spritesheetId, animationId, keyframe) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markAnimationDirty(tracker, animationId, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
        if (sheet.id !== spritesheetId) return sheet;
        const animations = sheet.animations.map((anim) =>
          anim.id === animationId
            ? { ...anim, keyframes: [...anim.keyframes, keyframe] }
            : anim
        );
        return { ...sheet, animations };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  updateKeyframe: (spritesheetId, animationId, keyframeId, updates) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markAnimationDirty(tracker, animationId, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
        if (sheet.id !== spritesheetId) return sheet;
        const animations = sheet.animations.map((anim) => {
          if (anim.id !== animationId) return anim;
          const keyframes = anim.keyframes.map((k: any) =>
            k.id === keyframeId ? { ...k, ...updates } : k
          );
          return { ...anim, keyframes };
        });
        return { ...sheet, animations };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  removeKeyframe: (spritesheetId, animationId, keyframeId) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markAnimationDirty(tracker, animationId, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
        if (sheet.id !== spritesheetId) return sheet;
        const animations = sheet.animations.map((anim) => {
          if (anim.id !== animationId) return anim;
          const keyframes = anim.keyframes.filter((k: any) => k.id !== keyframeId);
          return { ...anim, keyframes };
        });
        return { ...sheet, animations };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  addFrame: (spritesheetId, frame) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markFrameDirty(tracker, frame.id, spritesheetId);
      const spritesheets = state.project.spritesheets.map((s) =>
        s.id === spritesheetId ? { ...s, frames: [...s.frames, frame] } : s
      );
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  addLayer: (spritesheetId, frameId, newLayer) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markLayerDirty(tracker, newLayer.id, frameId, spritesheetId);
      tracker.structuralChanges.push(`Add Layer '${newLayer.name}'`);
      const spritesheets = state.project.spritesheets.map((sheet) => {
         if (sheet.id !== spritesheetId) return sheet;
         const frames = sheet.frames.map((frame) => {
            if (frame.id !== frameId) return frame;
            return { ...frame, layers: [...frame.layers, newLayer] };
         });
         return { ...sheet, frames };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  removeLayer: (spritesheetId, frameId, layerId) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      tracker.deletedLayers.set(layerId, { frameId, spritesheetId });
      markFrameDirty(tracker, frameId, spritesheetId);
      const sheet = state.project.spritesheets.find((s) => s.id === spritesheetId);
      const frame = sheet?.frames.find((f) => f.id === frameId);
      const layer = frame?.layers.find((l) => l.id === layerId);
      tracker.structuralChanges.push(`Remove Layer '${layer?.name || layerId}'`);
      const spritesheets = state.project.spritesheets.map((sheet) => {
         if (sheet.id !== spritesheetId) return sheet;
         const frames = sheet.frames.map((frame) => {
            if (frame.id !== frameId) return frame;
            return { ...frame, layers: frame.layers.filter((l) => l.id !== layerId) };
         });
         return { ...sheet, frames };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  updateLayer: (spritesheetId, frameId, layerId, updates) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markLayerDirty(tracker, layerId, frameId, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
         if (sheet.id !== spritesheetId) return sheet;
         const frames = sheet.frames.map((frame) => {
             if (frame.id !== frameId) return frame;
             return {
                 ...frame,
                 layers: frame.layers.map((l) => l.id === layerId ? { ...l, ...updates } : l)
             };
         });
         return { ...sheet, frames };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  reorderLayers: (spritesheetId, frameId, fromIndex, toIndex) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      markFrameDirty(tracker, frameId, spritesheetId);
      const spritesheets = state.project.spritesheets.map((sheet) => {
         if (sheet.id !== spritesheetId) return sheet;
         const frames = sheet.frames.map((frame) => {
            if (frame.id !== frameId) return frame;
            const newLayers = Array.from(frame.layers);
            const [moved] = newLayers.splice(fromIndex, 1);
            newLayers.splice(toIndex, 0, moved);
            return { ...frame, layers: newLayers };
         });
         return { ...sheet, frames };
      });
      return { changeTracker: { ...tracker }, project: { ...state.project, spritesheets } };
    }),

  addPalette: (palette) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      tracker.structuralChanges.push(`Add Palette '${palette.name}'`);
      return {
        changeTracker: { ...tracker },
        project: { ...state.project, palettes: [...state.project.palettes, palette] },
      };
    }),

  removePalette: (paletteId) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      const pal = state.project.palettes.find(p => p.id === paletteId);
      tracker.structuralChanges.push(`Remove Palette '${pal?.name || paletteId}'`);
      return {
        changeTracker: { ...tracker },
        project: { ...state.project, palettes: state.project.palettes.filter(p => p.id !== paletteId) },
      };
    }),

  updatePalette: (paletteId, updates) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      tracker.structuralChanges.push(`Update Palette`);
      return {
        changeTracker: { ...tracker },
        project: {
          ...state.project,
          palettes: state.project.palettes.map(p => p.id === paletteId ? { ...p, ...updates } : p),
        },
      };
    }),

  addColorToPalette: (paletteId, color) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      tracker.structuralChanges.push(`Add color to palette`);
      return {
        changeTracker: { ...tracker },
        project: {
          ...state.project,
          palettes: state.project.palettes.map(p =>
            p.id === paletteId ? { ...p, colors: [...p.colors, color] } : p
          ),
        },
      };
    }),

  removeColorFromPalette: (paletteId, colorIndex) =>
    set((state) => {
      if (!state.project) return state;
      const tracker = state.changeTracker;
      tracker.structuralChanges.push(`Remove color from palette`);
      return {
        changeTracker: { ...tracker },
        project: {
          ...state.project,
          palettes: state.project.palettes.map(p =>
            p.id === paletteId
              ? { ...p, colors: p.colors.filter((_, i) => i !== colorIndex) }
              : p
          ),
        },
      };
    }),
}));
