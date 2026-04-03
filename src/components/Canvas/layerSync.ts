import * as PIXI from 'pixi.js';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { TextureCache } from './textureCache';
import type { Spritesheet, SpriteFrame, Animation, Keyframe, Layer } from '../../types/project';

const layerTextureCache = new TextureCache();
const onionTextureCache = new TextureCache();

/** Managed sprite map for diff-based updates */
const layerSprites = new Map<string, PIXI.Sprite>();
/** Onion skin containers keyed by frameId+offset */
const onionContainers = new Map<string, PIXI.Container>();

export function disposeLayerSync() {
  layerTextureCache.dispose();
  onionTextureCache.dispose();
  layerSprites.clear();
  onionContainers.clear();
}

export function syncLayers(
  layerContainer: PIXI.Container,
  drawingTexture: PIXI.Texture,
  _drawingCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  appRef: React.MutableRefObject<PIXI.Application | null>,
  currentActiveLayerRef: { current: string | null },
  lastKnownFrameRef: { current: string | null },
) {
  const state = useProjectStore.getState();
  if (!state.project || !state.activeSpritesheetId || !state.activeFrameId) return;

  const activeSheet = state.project.spritesheets.find((s) => s.id === state.activeSpritesheetId);
  const frame = activeSheet?.frames.find((f) => f.id === state.activeFrameId);
  if (!frame) return;

  // If activeLayer changed OR frame changed, copy new active layer into drawingCanvas
  if (state.activeLayerId !== currentActiveLayerRef.current || state.activeFrameId !== lastKnownFrameRef.current) {
    currentActiveLayerRef.current = state.activeLayerId;
    lastKnownFrameRef.current = state.activeFrameId;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const aLayer = frame.layers.find((l) => l.id === state.activeLayerId);
    if (aLayer && aLayer.data) {
      const img = new Image();
      img.src = aLayer.data;
      img.onload = () => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, 0, 0);
        drawingTexture.source.update();
      };
    } else {
      drawingTexture.source.update();
    }
  }

  // --- Diff-based layer sprite management ---
  const currentLayerIds = new Set<string>();
  const activeTextureCacheKeys = new Set<string>();

  frame.layers.forEach((layer, index) => {
    currentLayerIds.add(layer.id);

    if (!layer.visible) {
      // If we have a sprite for a now-hidden layer, remove it
      const existing = layerSprites.get(layer.id);
      if (existing) {
        existing.removeFromParent();
        existing.destroy();
        layerSprites.delete(layer.id);
      }
      return;
    }

    let sprite = layerSprites.get(layer.id);

    if (layer.id === state.activeLayerId) {
      // Active layer uses the live drawing texture
      if (sprite) {
        // If existing sprite has a different texture, update it
        if (sprite.texture !== drawingTexture) {
          sprite.texture = drawingTexture;
        }
      } else {
        sprite = new PIXI.Sprite(drawingTexture);
        layerSprites.set(layer.id, sprite);
        layerContainer.addChild(sprite);
      }
    } else if (layer.data) {
      const cacheKey = `layer:${layer.id}`;
      activeTextureCacheKeys.add(cacheKey);

      if (!sprite) {
        sprite = new PIXI.Sprite();
        layerSprites.set(layer.id, sprite);
        layerContainer.addChild(sprite);
      }

      // Use texture cache — only re-decodes if layer.data changed
      const cached = layerTextureCache.getOrLoad(
        cacheKey,
        layer.data,
        sprite,
        () => !appRef.current || sprite!.destroyed,
      );
      if (cached) {
        sprite.texture = cached;
      }
    } else {
      // No data and not active — remove if exists
      if (sprite) {
        sprite.removeFromParent();
        sprite.destroy();
        layerSprites.delete(layer.id);
      }
      return;
    }

    // Update properties in-place
    sprite.zIndex = index;
    sprite.alpha = layer.opacity !== undefined ? layer.opacity : 1.0;
    applyBlendMode(sprite, layer.blendMode);
  });

  // Remove sprites for layers that no longer exist
  for (const [id, sprite] of layerSprites) {
    if (!currentLayerIds.has(id)) {
      sprite.removeFromParent();
      sprite.destroy();
      layerSprites.delete(id);
    }
  }

  // Prune stale texture cache entries
  layerTextureCache.prune(activeTextureCacheKeys);

  layerContainer.sortChildren();

  // --- Onion skins ---
  // Remove old onion containers first
  for (const [, container] of onionContainers) {
    container.removeFromParent();
    container.destroy({ children: true });
  }
  onionContainers.clear();

  const edState = useEditorStore.getState();
  if (edState.onionSkinEnabled && activeSheet) {
    renderOnionSkins(layerContainer, activeSheet, state, edState, appRef);
  }
}

function renderOnionSkins(
  layerContainer: PIXI.Container,
  activeSheet: Spritesheet,
  state: ReturnType<typeof useProjectStore.getState>,
  edState: ReturnType<typeof useEditorStore.getState>,
  appRef: React.MutableRefObject<PIXI.Application | null>,
) {
  let frameSequence = activeSheet.frames.map((f: SpriteFrame) => f.id);
  if (state.activeItemId && state.activeItemType === 'animation') {
    const anim = activeSheet.animations.find((a: Animation) => a.id === state.activeItemId);
    if (anim) {
      frameSequence = anim.keyframes
        .slice()
        .sort((a: Keyframe, b: Keyframe) => a.time - b.time)
        .map((k: Keyframe) => k.frameId);
    }
  }

  const currentIndex = state.activeFrameId ? frameSequence.indexOf(state.activeFrameId) : -1;
  if (currentIndex === -1 || frameSequence.length <= 1) return;

  const hexToPixiColor = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };

  const drawOnionSkinFrame = (frameId: string, offset: number, tintColor: number) => {
    const targetFrame = activeSheet.frames.find((f: SpriteFrame) => f.id === frameId);
    if (!targetFrame) return;

    const containerKey = `${frameId}:${offset}`;
    const onionContainer = new PIXI.Container();
    onionContainer.zIndex = -10 - offset;
    onionContainer.alpha = edState.onionSkinOpacity / offset;
    onionContainers.set(containerKey, onionContainer);

    targetFrame.layers.forEach((layer: Layer) => {
      if (!layer.visible) return;
      if (layer.data) {
        const spr = new PIXI.Sprite();
        spr.alpha = layer.opacity !== undefined ? layer.opacity : 1.0;
        spr.tint = tintColor;
        applyBlendMode(spr, layer.blendMode);
        onionContainer.addChild(spr);

        const cacheKey = `onion:${frameId}:${layer.id}`;
        const cached = onionTextureCache.getOrLoad(cacheKey, layer.data, spr, () => !appRef.current || spr.destroyed);
        if (cached) {
          spr.texture = cached;
        }
      }
    });

    layerContainer.addChild(onionContainer);
  };

  const beforeTint = hexToPixiColor(edState.onionSkinBeforeTint || '#ff4444');
  const afterTint = hexToPixiColor(edState.onionSkinAfterTint || '#4444ff');

  const len = frameSequence.length;
  for (let i = 1; i <= edState.onionSkinBefore; i++) {
    const wrappedIndex = (currentIndex - (i % len) + len) % len;
    drawOnionSkinFrame(frameSequence[wrappedIndex], i, beforeTint);
  }
  for (let i = 1; i <= edState.onionSkinAfter; i++) {
    const wrappedIndex = (currentIndex + i) % len;
    drawOnionSkinFrame(frameSequence[wrappedIndex], i, afterTint);
  }
}

function applyBlendMode(sprite: PIXI.Sprite, blendMode: string | undefined) {
  if (blendMode === 'multiply') sprite.blendMode = 'multiply';
  else if (blendMode === 'screen') sprite.blendMode = 'screen';
  else if (blendMode === 'overlay') sprite.blendMode = 'overlay';
}
