import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectSize = 'sm' | 'md';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  size?: SelectSize;
  placeholder?: string;
}

const sizeStyles: Record<SelectSize, string> = {
  sm: 'px-2 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
};

export const Select: React.FC<SelectProps> = ({ options, size = 'sm', placeholder, className = '', ...props }) => {
  return (
    <div className={`relative ${className}`}>
      <select
        className={`
          w-full bg-slate-900 border border-slate-600 rounded text-slate-200
          cursor-pointer appearance-none
          hover:border-slate-500 focus:border-indigo-500
          focus:outline-none focus:ring-1 focus:ring-indigo-500
          transition-colors
          ${sizeStyles[size]}
        `
          .trim()
          .replace(/\s+/g, ' ')}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};
