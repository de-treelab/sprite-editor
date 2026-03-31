import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow hover:shadow-lg',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  ghost: 'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  return (
    <button
      className={`
        rounded font-medium transition flex flex-row
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
