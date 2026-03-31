import React from 'react';
import { Toggle } from './Toggle';

interface SectionHeaderProps {
  title: string;
  actions?: React.ReactNode;
  toggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actions,
  toggle,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {actions}
        {toggle && (
          <Toggle checked={toggle.checked} onChange={toggle.onChange} />
        )}
      </div>
    </div>
  );
};
