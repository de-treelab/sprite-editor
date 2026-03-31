import React from 'react';
import { IconType } from 'react-icons';

export type IconButtonVariant = 'default' | 'active' | 'danger' | 'toggle';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconType;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isActive?: boolean;
  label?: string;
}

const sizeStyles: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: { button: 'w-6 h-6', icon: 'text-sm' },
  md: { button: 'w-8 h-8', icon: 'text-base' },
  lg: { button: 'w-10 h-10', icon: 'text-xl' },
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = 'default',
  size = 'md',
  isActive = false,
  label,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    if (disabled) {
      return 'text-slate-600 cursor-not-allowed';
    }

    switch (variant) {
      case 'active':
        return isActive
          ? 'bg-indigo-500 text-white'
          : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200';
      case 'danger':
        return 'text-slate-400 hover:bg-red-900/50 hover:text-red-400';
      case 'toggle':
        return isActive
          ? 'text-indigo-400'
          : 'text-slate-500 hover:bg-slate-600';
      default:
        return 'text-slate-400 hover:bg-slate-700 hover:text-white';
    }
  };

  return (
    <button
      className={`
        flex items-center justify-center rounded-md transition-colors
        ${sizeStyles[size].button}
        ${getVariantStyles()}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      title={label}
      disabled={disabled}
      {...props}
    >
      <Icon className={sizeStyles[size].icon} />
    </button>
  );
};
