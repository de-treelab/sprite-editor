import React from 'react';

interface SpeedButtonGroupProps {
  value: number;
  onChange: (speed: number) => void;
  speeds?: number[];
  className?: string;
}

export const SpeedButtonGroup: React.FC<SpeedButtonGroupProps> = ({
  value,
  onChange,
  speeds = [0.5, 1, 2],
  className = '',
}) => {
  return (
    <div
      className={`
        flex bg-slate-900 rounded-full overflow-hidden border border-slate-700
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {speeds.map((speed) => (
        <button
          key={speed}
          onClick={() => onChange(speed)}
          className={`
            px-2 py-0.5 text-xs font-bold transition-colors
            ${value === speed
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }
          `.trim().replace(/\s+/g, ' ')}
        >
          {speed}x
        </button>
      ))}
    </div>
  );
};

// Generic button group for any options
interface ButtonGroupOption<T> {
  value: T;
  label: string;
}

interface ButtonGroupProps<T> {
  value: T;
  onChange: (value: T) => void;
  options: ButtonGroupOption<T>[];
  className?: string;
}

export function ButtonGroup<T extends string | number>({
  value,
  onChange,
  options,
  className = '',
}: ButtonGroupProps<T>) {
  return (
    <div
      className={`
        flex bg-slate-900 rounded-md overflow-hidden border border-slate-700
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-1 text-xs font-medium transition-colors
            ${value === option.value
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
            }
          `.trim().replace(/\s+/g, ' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
