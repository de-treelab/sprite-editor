import React from 'react';

export type NumberInputSize = 'sm' | 'md';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  size?: NumberInputSize;
}

const sizeStyles: Record<NumberInputSize, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
};

export const NumberInput: React.FC<NumberInputProps> = ({ size = 'md', className = '', ...props }) => {
  return (
    <input
      type="number"
      className={`
        w-full bg-slate-900 border border-slate-700 rounded text-slate-200
        outline-none focus:border-indigo-500 transition-colors
        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
        ${sizeStyles[size]}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
      {...props}
    />
  );
};
