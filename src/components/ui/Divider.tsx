import React from 'react';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ orientation = 'horizontal', className = '' }) => {
  if (orientation === 'vertical') {
    return <div className={`w-px h-full bg-slate-700 ${className}`} />;
  }

  return <div className={`h-px w-full bg-slate-700 my-2 ${className}`} />;
};

// Compact divider for toolbars
export const ToolbarDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full h-px bg-slate-700 my-2 ${className}`} />
);

// Menu divider (alias for consistency)
export const MenuDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px bg-slate-700 my-1 ${className}`} />
);
