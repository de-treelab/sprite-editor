import React from 'react';
import type { LayoutNode } from '../../layouts/layoutTypes';
import { useLayoutStore } from '../../store/layoutStore';
import { LayoutSplitContainer } from './LayoutSplitContainer';
import { LayoutPanelContainer } from './LayoutPanelContainer';
import { FloatingPanel } from './FloatingPanel';

/** Recursively renders a LayoutNode — exported for use by LayoutSplitContainer */
export const LayoutNodeRenderer: React.FC<{ node: LayoutNode }> = ({ node }) => {
  if (node.type === 'panel') {
    return <LayoutPanelContainer panel={node} />;
  }
  return <LayoutSplitContainer node={node} />;
};

export const LayoutRoot: React.FC = () => {
  const layout = useLayoutStore((s) => s.layout);

  // Fullscreen mode: render only that view
  if (layout.fullscreenViewId) {
    const fullscreenPanel = {
      type: 'panel' as const,
      id: '__fullscreen__',
      viewIds: [layout.fullscreenViewId],
      activeViewId: layout.fullscreenViewId,
    };
    return (
      <div className="flex flex-1 overflow-hidden">
        <LayoutPanelContainer panel={fullscreenPanel} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden relative">
      <LayoutNodeRenderer node={layout.root} />

      {/* Floating panels layer */}
      {layout.floating.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {layout.floating.map((fp) => (
            <div key={fp.panelId} className="pointer-events-auto">
              <FloatingPanel panel={fp} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
