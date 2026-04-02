import React from 'react';

interface RangeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  showNumberInput?: boolean;
  className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  showValue = true,
  valueFormatter,
  showNumberInput = false,
  className = '',
}) => {
  const displayValue = valueFormatter ? valueFormatter(value) : String(value);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-slate-400 shrink-0 w-16">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
      {showNumberInput ? (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-12 px-1 py-0.5 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 text-center"
        />
      ) : showValue ? (
        <span className="text-xs text-slate-300 w-8 text-right font-mono shrink-0">{displayValue}</span>
      ) : null}
    </div>
  );
};
