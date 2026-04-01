import React, { useState, useCallback, useRef } from 'react';
import type { LayoutSplit } from '../../layouts/layoutTypes';
import { useLayoutStore } from '../../store/layoutStore';
import { LayoutNodeRenderer } from './LayoutRoot';

interface ResizeSplitterProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

const ResizeSplitter: React.FC<ResizeSplitterProps> = ({ direction, onResize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;

    const handleMouseMove = (me: MouseEvent) => {
      const current = direction === 'horizontal' ? me.clientX : me.clientY;
      const delta = current - startPos.current;
      startPos.current = current;
      onResize(delta);
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
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction, onResize]);

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`
        ${isHorizontal ? 'w-1 cursor-col-resize hover:bg-indigo-500/50' : 'h-1 cursor-row-resize hover:bg-indigo-500/50'}
        ${isDragging ? 'bg-indigo-500' : 'bg-slate-700'}
        flex-shrink-0 transition-colors
      `}
      onMouseDown={handleMouseDown}
    />
  );
};

interface LayoutSplitContainerProps {
  node: LayoutSplit;
}

export const LayoutSplitContainer: React.FC<LayoutSplitContainerProps> = ({ node }) => {
  const setSplitSizes = useLayoutStore(s => s.setSplitSizes);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef(node);
  nodeRef.current = node;

  const handleResize = useCallback((index: number, delta: number) => {
    if (!containerRef.current) return;

    const currentNode = nodeRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const totalSize = currentNode.direction === 'horizontal' ? rect.width : rect.height;
    if (totalSize === 0) return;

    const deltaProportion = delta / totalSize;
    const newSizes = [...currentNode.sizes];

    // Minimum proportion for a panel
    const minSize = 0.03;

    const newLeft = newSizes[index] + deltaProportion;
    const newRight = newSizes[index + 1] - deltaProportion;

    if (newLeft < minSize || newRight < minSize) return;

    newSizes[index] = newLeft;
    newSizes[index + 1] = newRight;

    setSplitSizes(currentNode.id, newSizes);
  }, [setSplitSizes]);

  const isHorizontal = node.direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 min-h-0 min-w-0 overflow-hidden ${isHorizontal ? 'flex-row' : 'flex-col'}`}
    >
      {node.children.map((child, index) => (
        <React.Fragment key={child.id}>
          {index > 0 && (
            <ResizeSplitter
              direction={node.direction}
              onResize={(delta) => handleResize(index - 1, delta)}
            />
          )}
          <div
            className="overflow-hidden min-h-0 min-w-0 flex"
            style={{
              [isHorizontal ? 'width' : 'height']: `${(node.sizes[index] ?? (1 / node.children.length)) * 100}%`,
              flexShrink: 0,
              flexGrow: 0,
            }}
          >
            <LayoutNodeRenderer node={child} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
