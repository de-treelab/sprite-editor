import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md';
  border?: boolean;
}

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
};

export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  padding = 'md',
  border = true,
}) => {
  return (
    <div
      className={`
        bg-slate-800
        ${border ? 'border border-slate-700' : ''}
        ${paddingStyles[padding]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
};

// Section panel with bottom border (for sidebar sections)
interface SectionPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionPanel: React.FC<SectionPanelProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`border-b border-slate-700 py-3 px-4 ${className}`}>
      {children}
    </div>
  );
};
