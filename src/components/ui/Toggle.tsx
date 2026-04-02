import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled = false, className = '' }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        w-8 h-4 rounded-full flex items-center transition-colors px-0.5
        ${checked ? 'bg-indigo-500' : 'bg-slate-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      <div
        className={`
          w-3 h-3 rounded-full bg-white transition-transform
          ${checked ? 'translate-x-4' : 'translate-x-0'}
        `
          .trim()
          .replace(/\s+/g, ' ')}
      />
    </button>
  );
};
