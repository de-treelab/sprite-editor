import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => {
  return (
    <div
      className={`
        flex-1 flex flex-col items-center justify-center
        text-slate-500 bg-slate-900 border border-slate-700
        m-2 rounded-lg p-8
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <div className="text-lg font-medium">{title}</div>
      {description && <div className="text-sm text-slate-600 mt-2 text-center max-w-xs">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// Compact variant for smaller spaces
interface CompactEmptyStateProps {
  text: string;
  className?: string;
}

export const CompactEmptyState: React.FC<CompactEmptyStateProps> = ({ text, className = '' }) => {
  return (
    <div
      className={`
        flex items-center justify-center p-4
        text-sm text-slate-500 italic
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {text}
    </div>
  );
};
