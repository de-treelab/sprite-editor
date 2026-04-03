import { useRef, useEffect, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import { useEditorStore } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasCommands } from '../../hooks/useCanvasCommands';
import { initPixiEditor } from './initPixi';

export const PixiEditor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const viewportRef = useRef<PIXI.Container | null>(null);
  const setFocusedView = useEditorStore((state) => state.setFocusedView);

  // Register canvas-scoped commands
  useCanvasCommands();

  const project = useProjectStore((state) => state.project);
  const activeSpritesheetId = useProjectStore((state) => state.activeSpritesheetId);
  const activeItemId = useProjectStore((state) => state.activeItemId);
  const activeItemType = useProjectStore((state) => state.activeItemType);

  // Compute effective canvas size from animation/image or project default
  const effectiveCanvasSize = useMemo(() => {
    if (!project) return { width: 32, height: 32 };
    const sheet = project.spritesheets.find((s) => s.id === activeSpritesheetId);
    if (activeItemType === 'image') {
      const img = (sheet?.images || []).find((i) => i.id === activeItemId);
      return img?.canvasSize || project.defaultCanvasSize;
    }
    const anim = sheet?.animations.find((a) => a.id === activeItemId);
    return anim?.canvasSize || project.defaultCanvasSize;
  }, [project, activeSpritesheetId, activeItemId, activeItemType]);

  const canvasW = effectiveCanvasSize.width;
  const canvasH = effectiveCanvasSize.height;

  useEffect(() => {
    if (!containerRef.current || !project) return;

    const { destroy } = initPixiEditor({
      containerRef,
      appRef,
      viewportRef,
      canvasW,
      canvasH,
    });

    return destroy;
  }, [project?.id, canvasW, canvasH]);

  return (
    <div
      className="flex-1 w-full h-full overflow-hidden relative flex items-center justify-center bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      ref={containerRef}
      tabIndex={0}
      onFocus={() => setFocusedView('canvas')}
    >
      {!project && <div className="text-slate-500">No project loaded</div>}
    </div>
  );
};
