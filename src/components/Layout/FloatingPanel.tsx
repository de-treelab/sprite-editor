import React, { useCallback, useRef, useState } from 'react';
import type { FloatingPanel as FloatingPanelType } from '../../layouts/layoutTypes';
import { useLayoutStore } from '../../store/layoutStore';
import { getView } from '../../layouts/viewRegistry';
import { ViewSlot } from './ViewSlot';

interface FloatingPanelProps {
  panel: FloatingPanelType;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({ panel }) => {
  const moveFloating = useLayoutStore((s) => s.moveFloating);
  const resizeFloating = useLayoutStore((s) => s.resizeFloating);
  const bringFloatingToFront = useLayoutStore((s) => s.bringFloatingToFront);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const removeView = useLayoutStore((s) => s.removeView);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setIsDragging] = useState(false);
  const [, setIsResizing] = useState(false);

  const handleTitleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      setIsDragging(true);
      bringFloatingToFront(panel.panelId);

      const startX = e.clientX - panel.x;
      const startY = e.clientY - panel.y;

      const handleMouseMove = (me: MouseEvent) => {
        moveFloating(panel.panelId, {
          x: Math.max(0, me.clientX - startX),
          y: Math.max(0, me.clientY - startY),
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    },
    [panel.panelId, panel.x, panel.y, moveFloating, bringFloatingToFront],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      bringFloatingToFront(panel.panelId);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = panel.width;
      const startHeight = panel.height;

      const handleMouseMove = (me: MouseEvent) => {
        resizeFloating(panel.panelId, {
          width: Math.max(200, startWidth + (me.clientX - startX)),
          height: Math.max(150, startHeight + (me.clientY - startY)),
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';
    },
    [panel.panelId, panel.width, panel.height, resizeFloating, bringFloatingToFront],
  );

  const handleCloseView = useCallback(
    (viewId: string) => {
      removeView(viewId);
    },
    [removeView],
  );

  const activeViewDef = getView(panel.activeViewId);

  return (
    <div
      ref={containerRef}
      className="absolute bg-slate-800 border border-slate-600 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        zIndex: panel.zIndex,
      }}
      onMouseDown={() => bringFloatingToFront(panel.panelId)}
    >
      {/* Title bar */}
      <div
        className="h-7 bg-slate-700 border-b border-slate-600 flex items-center px-2 shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleTitleBarMouseDown}
      >
        {panel.viewIds.length === 1 ? (
          <>
            {activeViewDef && (
              <>
                <activeViewDef.icon className="w-3 h-3 mr-1.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-300 flex-1 truncate">{activeViewDef.title}</span>
              </>
            )}
            <button
              className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-red-400 text-xs"
              onClick={() => handleCloseView(panel.activeViewId)}
            >
              ×
            </button>
          </>
        ) : (
          <div className="flex items-center flex-1 overflow-x-auto gap-0.5">
            {panel.viewIds.map((viewId) => {
              const vDef = getView(viewId);
              if (!vDef) return null;
              const isActive = viewId === panel.activeViewId;
              return (
                <button
                  key={viewId}
                  className={`flex items-center px-1.5 py-0.5 text-[10px] rounded group ${
                    isActive ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => setActiveTab(panel.panelId, viewId)}
                >
                  <vDef.icon className="w-2.5 h-2.5 mr-1" />
                  {vDef.title}
                  <span
                    className="ml-1 text-slate-500 hover:text-red-400 hidden group-hover:inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseView(viewId);
                    }}
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <ViewSlot viewId={panel.activeViewId} />
      </div>

      {/* Resize handle */}
      <div className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize" onMouseDown={handleResizeMouseDown}>
        <svg className="w-3 h-3 text-slate-500" viewBox="0 0 12 12">
          <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
};
