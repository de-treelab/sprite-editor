import React from 'react';

export type TextInputSize = 'sm' | 'md';

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: TextInputSize;
}

const sizeStyles: Record<TextInputSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
};

export const TextInput: React.FC<TextInputProps> = ({ size = 'md', className = '', ...props }) => {
  return (
    <input
      type="text"
      className={`
        w-full bg-slate-900 border border-slate-700 rounded text-slate-200
        outline-none focus:border-indigo-500 transition-colors
        placeholder:text-slate-500
        ${sizeStyles[size]}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
      {...props}
    />
  );
};
