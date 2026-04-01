import React, { useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';

export const PreviewPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRenderedRef = useRef<{ frameId: string | null; data: string | null }>({ frameId: null, data: null });
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const setFocusedView = useEditorStore((s) => s.setFocusedView);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.current.appendChild(canvas);
    canvasRef.current = canvas;

    const dpr = window.devicePixelRatio || 1;

    const syncCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;
    };

    syncCanvasSize();

    const drawCheckerboard = (ctx: CanvasRenderingContext2D, cx: number, cy: number, canvasSize: { width: number; height: number }, pxSize: number) => {
      const halfW = (canvasSize.width * pxSize) / 2;
      const halfH = (canvasSize.height * pxSize) / 2;
      const startX = cx - halfW;
      const startY = cy - halfH;
      for (let i = 0; i < canvasSize.width; i++) {
        for (let j = 0; j < canvasSize.height; j++) {
          ctx.fillStyle = (i + j) % 2 === 0 ? '#334155' : '#1e293b';
          ctx.fillRect(startX + i * pxSize, startY + j * pxSize, pxSize, pxSize);
        }
      }
    };

    const renderFrame = () => {
      const el = canvasRef.current;
      if (!el) return;
      const ctx = el.getContext('2d');
      if (!ctx) return;

      const state = useProjectStore.getState();
      const edState = useEditorStore.getState();
      const frameId = edState.playbackFrameId || state.activeFrameId;

      const sheet = state.project?.spritesheets.find(s => s.id === state.activeSpritesheetId);

      // Clear to background
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = el.width / dpr;
      const h = el.height / dpr;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      if (!sheet || !frameId || !state.project) {
        ctx.restore();
        lastRenderedRef.current = { frameId: null, data: null };
        return;
      }

      const frame = sheet.frames.find(f => f.id === frameId);
      if (!frame) {
        ctx.restore();
        lastRenderedRef.current = { frameId: null, data: null };
        return;
      }

      const activeAnim = sheet.animations.find(a => a.id === state.activeItemId);
      const canvasSize = activeAnim?.canvasSize || state.project.defaultCanvasSize;

      // Compute pixel size to fit the sprite inside the container with padding
      const padding = 8;
      const cx = w / 2;
      const cy = h / 2;
      const maxW = w - padding * 2;
      const maxH = h - padding * 2;
      const pxSize = Math.max(1, Math.floor(Math.min(maxW / canvasSize.width, maxH / canvasSize.height)));

      drawCheckerboard(ctx, cx, cy, canvasSize, pxSize);

      // Compute frame data string for dedup
      const frameDataStr = JSON.stringify(
        frame.layers.map(l => ({
          id: l.id, data: l.data, visible: l.visible, opacity: l.opacity, blendMode: l.blendMode, isReference: l.isReference,
        })),
      );

      const needsFullRender = lastRenderedRef.current.frameId !== frameId || lastRenderedRef.current.data !== frameDataStr;
      lastRenderedRef.current = { frameId, data: frameDataStr };

      // Draw layers
      const originX = cx - (canvasSize.width * pxSize) / 2;
      const originY = cy - (canvasSize.height * pxSize) / 2;

      const sortedLayers = [...frame.layers]
        .map((l, idx) => ({ ...l, zIndex: idx }))
        .filter(l => l.visible && !l.isReference && l.data);

      let pending = sortedLayers.length;
      if (pending === 0) {
        ctx.restore();
        return;
      }

      const drawLayers = () => {
        // Re-acquire context state for async callback
        const ctx2 = el.getContext('2d');
        if (!ctx2) return;
        ctx2.save();
        ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Redraw background + checkerboard (images loaded async, we need clean slate)
        ctx2.fillStyle = '#0f172a';
        ctx2.fillRect(0, 0, w, h);
        drawCheckerboard(ctx2, cx, cy, canvasSize, pxSize);

        for (const layer of sortedLayers) {
          const cached = imageCache.current.get(layer.data);
          if (!cached) continue;

          ctx2.save();
          ctx2.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;
          if (layer.blendMode === 'multiply') ctx2.globalCompositeOperation = 'multiply';
          else if (layer.blendMode === 'screen') ctx2.globalCompositeOperation = 'screen';
          else if (layer.blendMode === 'overlay') ctx2.globalCompositeOperation = 'overlay';

          ctx2.imageSmoothingEnabled = false;
          ctx2.drawImage(cached, originX, originY, canvasSize.width * pxSize, canvasSize.height * pxSize);
          ctx2.restore();
        }
        ctx2.restore();
      };

      // Load all layer images, then composite
      if (!needsFullRender) {
        // Data unchanged — just redraw from cache (checkerboard was already redrawn above)
        drawLayers();
        ctx.restore();
        return;
      }

      let loaded = 0;
      for (const layer of sortedLayers) {
        const cached = imageCache.current.get(layer.data);
        if (cached && cached.complete) {
          loaded++;
          if (loaded === pending) {
            drawLayers();
            ctx.restore();
          }
          continue;
        }
        const img = new Image();
        img.src = layer.data;
        img.onload = () => {
          imageCache.current.set(layer.data, img);
          loaded++;
          if (loaded === pending) {
            drawLayers();
          }
        };
        img.onerror = () => {
          loaded++;
          if (loaded === pending) {
            drawLayers();
          }
        };
      }

      ctx.restore();
    };

    renderFrame();

    const resizeObserver = new ResizeObserver(() => {
      syncCanvasSize();
      // Force re-render on resize (invalidate dedup)
      lastRenderedRef.current = { frameId: null, data: null };
      renderFrame();
    });
    resizeObserver.observe(containerRef.current);

    const unsubscribeProjectStore = useProjectStore.subscribe(() => {
      renderFrame();
    });

    const unsubscribeEditorStore = useEditorStore.subscribe((state, prevState) => {
      if (state.playbackFrameId !== prevState.playbackFrameId) {
        renderFrame();
      }
    });

    return () => {
      resizeObserver.disconnect();
      unsubscribeProjectStore();
      unsubscribeEditorStore();
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current);
      }
      canvasRef.current = null;
      imageCache.current.clear();
    };
  }, []);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-2 min-h-0 relative focus:outline-none focus:ring-2 focus:ring-indigo-500"
      tabIndex={0}
      onFocus={() => setFocusedView('preview')}
    >
      <div
        ref={containerRef}
        className="w-full h-full relative rounded-md overflow-hidden shadow-inner border border-slate-700 bg-slate-950"
      />
    </div>
  );
};
