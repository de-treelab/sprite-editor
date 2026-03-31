import React from 'react';
import { IconType } from 'react-icons';

interface MenuItemProps {
  label: string;
  icon?: IconType;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  shortcut?: string;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  shortcut,
  className = '',
}) => {
  const baseStyles = 'w-full text-left px-4 py-2 text-sm flex items-center transition-colors';

  const stateStyles = disabled
    ? 'text-slate-500 cursor-not-allowed'
    : danger
      ? 'text-red-400 hover:bg-red-900/50 hover:text-red-300'
      : 'text-slate-300 hover:bg-indigo-600 hover:text-white';

  return (
    <button
      className={`${baseStyles} ${stateStyles} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon && <Icon className="mr-2 w-4 h-4" />}
      <span className="flex-1">{label}</span>
      {shortcut && (
        <span className="ml-4 text-xs text-slate-500">{shortcut}</span>
      )}
    </button>
  );
};

// Menu divider
export const MenuDivider: React.FC = () => (
  <div className="h-px bg-slate-700 my-1" />
);
