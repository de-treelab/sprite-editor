import React from 'react';
import type { Anchor } from '../../layouts/layoutTypes';

interface LayoutDropZoneProps {
  anchor: Anchor | null;
}

export const LayoutDropZone: React.FC<LayoutDropZoneProps> = ({ anchor }) => {
  if (!anchor) return null;

  const highlightStyles: Record<Anchor, string> = {
    left: 'left-0 top-0 w-1/4 h-full',
    right: 'right-0 top-0 w-1/4 h-full',
    top: 'left-0 top-0 w-full h-1/4',
    bottom: 'left-0 bottom-0 w-full h-1/4',
    center: 'left-0 top-0 w-full h-full',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      <div className={`absolute ${highlightStyles[anchor]} bg-indigo-500/20 border-2 border-indigo-500/50 rounded`} />
    </div>
  );
};
