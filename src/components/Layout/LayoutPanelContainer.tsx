import React, { useCallback, useRef, useState } from 'react';
import type { LayoutPanel, Anchor } from '../../layouts/layoutTypes';
import { useLayoutStore } from '../../store/layoutStore';
import { getView } from '../../layouts/viewRegistry';
import { ViewSlot } from './ViewSlot';
import { LayoutDropZone } from './LayoutDropZone';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

interface LayoutTabBarProps {
  panel: LayoutPanel;
}

const LayoutTabBar: React.FC<LayoutTabBarProps> = ({ panel }) => {
  const setActiveTab = useLayoutStore(s => s.setActiveTab);
  const removeView = useLayoutStore(s => s.removeView);

  if (panel.viewIds.length <= 1) {
    // Single view — show a minimal draggable header
    const viewDef = panel.viewIds[0] ? getView(panel.viewIds[0]) : undefined;
    if (!viewDef) return null;
    const Icon = viewDef.icon;
    return (
      <div
        className="h-7 bg-slate-800 border-b border-slate-700 flex items-center px-2 shrink-0 cursor-grab active:cursor-grabbing group"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/layout-view', JSON.stringify({
            viewId: panel.viewIds[0],
            sourcePanelId: panel.id,
          }));
          e.dataTransfer.effectAllowed = 'move';
        }}
      >
        <Icon className="w-3 h-3 mr-1.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-300 truncate flex-1">{viewDef.title}</span>
        <button
          className="ml-1.5 w-3 h-3 text-slate-500 hover:text-red-400 inline-flex items-center justify-center text-[10px] leading-none"
          onClick={(e) => {
            e.stopPropagation();
            removeView(panel.viewIds[0]!);
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="h-7 bg-slate-800 border-b border-slate-700 shrink-0">
      <OverlayScrollbarsComponent
        element="div"
        options={{ scrollbars: { theme: 'os-theme-light', autoHide: 'move', autoHideDelay: 800 }, overflow: { y: 'hidden' } }}
        style={{ height: '100%' }}
      >
        <div className="flex items-center h-full">
        {panel.viewIds.map(viewId => {
        const viewDef = getView(viewId);
        if (!viewDef) return null;
        const isActive = panel.activeViewId === viewId;
        const Icon = viewDef.icon;

        return (
          <div
            key={viewId}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/layout-view', JSON.stringify({
                viewId,
                sourcePanelId: panel.id,
              }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            className={`
              flex items-center px-2 h-full text-xs cursor-pointer border-r border-slate-700 shrink-0 group
              ${isActive
                ? 'bg-slate-900 text-white border-b-2 border-b-indigo-500'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }
            `}
            onClick={() => setActiveTab(panel.id, viewId)}
          >
            <Icon className="w-3 h-3 mr-1.5" />
            <span className="truncate">{viewDef.title}</span>
            <button
              className="ml-1.5 w-3 h-3 text-slate-500 hover:text-red-400 items-center justify-center text-[10px] leading-none"
              onClick={(e) => {
                e.stopPropagation();
                removeView(viewId);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};

interface LayoutPanelContainerProps {
  panel: LayoutPanel;
}

export const LayoutPanelContainer: React.FC<LayoutPanelContainerProps> = ({ panel }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropAnchor, setDropAnchor] = useState<Anchor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const moveView = useLayoutStore(s => s.moveView);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/layout-view')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);

    // Determine anchor from mouse position
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const edgeThreshold = 0.25;
    let anchor: Anchor = 'center';
    if (x < edgeThreshold) anchor = 'left';
    else if (x > 1 - edgeThreshold) anchor = 'right';
    else if (y < edgeThreshold) anchor = 'top';
    else if (y > 1 - edgeThreshold) anchor = 'bottom';

    setDropAnchor(anchor);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only trigger if leaving the container itself
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setDropAnchor(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropAnchor(null);

    const data = e.dataTransfer.getData('application/layout-view');
    if (!data) return;
    try {
      const { viewId } = JSON.parse(data);
      const anchor = dropAnchor ?? 'center';
      moveView(viewId, panel.id, anchor);
    } catch { /* ignore */ }
  }, [dropAnchor, moveView, panel.id]);

  if (panel.viewIds.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <LayoutTabBar panel={panel} />
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <ViewSlot viewId={panel.activeViewId} />
      </div>
      {isDragOver && <LayoutDropZone anchor={dropAnchor} />}
    </div>
  );
};
