import React from 'react';

interface ListItemProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
  children,
  isSelected = false,
  onClick,
  onDoubleClick,
  isDragging = false,
  isDragOver = false,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center p-2 rounded cursor-pointer border transition-colors
        ${isDragOver ? 'border-t-indigo-400' : 'border-transparent'}
        ${isSelected
          ? 'bg-indigo-900/40 border-indigo-500/50'
          : 'bg-slate-700/50 hover:bg-slate-700'
        }
        ${isDragging ? 'opacity-50' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {children}
    </div>
  );
};

// Simple variant for non-draggable lists
interface SimpleListItemProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
}

export const SimpleListItem: React.FC<SimpleListItemProps> = ({
  children,
  isSelected = false,
  onClick,
  onDoubleClick,
  className = '',
}) => {
  return (
    <div
      className={`
        flex items-center p-1 rounded cursor-pointer
        ${isSelected
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-700'
        }
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  );
};
