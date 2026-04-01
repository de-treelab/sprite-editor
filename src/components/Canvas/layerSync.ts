import * as PIXI from 'pixi.js';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';

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

  const activeSheet = state.project.spritesheets.find(s => s.id === state.activeSpritesheetId);
  const frame = activeSheet?.frames.find(f => f.id === state.activeFrameId);
  if (!frame) return;

  // If activeLayer changed OR frame changed, copy new active layer into drawingCanvas
  if (state.activeLayerId !== currentActiveLayerRef.current || state.activeFrameId !== lastKnownFrameRef.current) {
    currentActiveLayerRef.current = state.activeLayerId;
    lastKnownFrameRef.current = state.activeFrameId;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const aLayer = frame.layers.find(l => l.id === state.activeLayerId);
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

  layerContainer.removeChildren();

  const edState = useEditorStore.getState();
  if (edState.onionSkinEnabled && activeSheet) {
    renderOnionSkins(layerContainer, activeSheet, state, edState, appRef);
  }

  frame.layers.forEach((layer, index) => {
    if (!layer.visible) return;

    if (layer.id === state.activeLayerId) {
      const sprite = new PIXI.Sprite(drawingTexture);
      sprite.zIndex = index;
      sprite.alpha = layer.opacity !== undefined ? layer.opacity : 1.0;
      applyBlendMode(sprite, layer.blendMode);
      layerContainer.addChild(sprite);
    } else if (layer.data) {
      const sprite = new PIXI.Sprite();
      sprite.zIndex = index;
      sprite.alpha = layer.opacity !== undefined ? layer.opacity : 1.0;
      applyBlendMode(sprite, layer.blendMode);
      layerContainer.addChild(sprite);

      const img = new Image();
      img.src = layer.data;
      img.onload = () => {
        if (!appRef.current || sprite.destroyed) return;
        sprite.texture = PIXI.Texture.from(img);
        sprite.texture.source.scaleMode = 'nearest';
      };
    }
  });

  layerContainer.sortChildren();
}

function renderOnionSkins(
  layerContainer: PIXI.Container,
  activeSheet: any,
  state: ReturnType<typeof useProjectStore.getState>,
  edState: ReturnType<typeof useEditorStore.getState>,
  appRef: React.MutableRefObject<PIXI.Application | null>,
) {
  let frameSequence = activeSheet.frames.map((f: any) => f.id);
  if (state.activeItemId && state.activeItemType === 'animation') {
    const anim = activeSheet.animations.find((a: any) => a.id === state.activeItemId);
    if (anim) {
      frameSequence = anim.keyframes.slice().sort((a: any, b: any) => a.time - b.time).map((k: any) => k.frameId);
    }
  }

  const currentIndex = frameSequence.indexOf(state.activeFrameId);
  if (currentIndex === -1 || frameSequence.length <= 1) return;

  const hexToPixiColor = (hex: string): number => {
    return parseInt(hex.replace('#', ''), 16);
  };

  const drawOnionSkinFrame = (frameId: string, offset: number, tintColor: number) => {
    const targetFrame = activeSheet.frames.find((f: any) => f.id === frameId);
    if (!targetFrame) return;

    const onionContainer = new PIXI.Container();
    onionContainer.zIndex = -10 - offset;
    onionContainer.alpha = edState.onionSkinOpacity / offset;

    targetFrame.layers.forEach((layer: any) => {
      if (!layer.visible) return;
      if (layer.data) {
        const spr = new PIXI.Sprite();
        spr.alpha = layer.opacity !== undefined ? layer.opacity : 1.0;
        spr.tint = tintColor;
        applyBlendMode(spr, layer.blendMode);
        onionContainer.addChild(spr);

        const im = new Image();
        im.src = layer.data;
        im.onload = () => {
          if (!appRef.current || spr.destroyed) return;
          spr.texture = PIXI.Texture.from(im);
          spr.texture.source.scaleMode = 'nearest';
        };
      }
    });

    layerContainer.addChild(onionContainer);
  };

  const beforeTint = hexToPixiColor(edState.onionSkinBeforeTint || '#ff4444');
  const afterTint = hexToPixiColor(edState.onionSkinAfterTint || '#4444ff');

  const len = frameSequence.length;
  for (let i = 1; i <= edState.onionSkinBefore; i++) {
    const wrappedIndex = (currentIndex - i % len + len) % len;
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
