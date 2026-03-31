import React from 'react';

interface TimelineRulerProps {
  maxTime: number;
  zoom: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ maxTime, zoom }) => (
  <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-6 border-b border-slate-800 text-[10px] text-slate-500">
    {Array.from({ length: Math.ceil((maxTime + 200) / 100) }).map((_, i) => (
      <div
        key={i}
        className="absolute top-0 bottom-0 border-l border-slate-800 pl-1 pt-1"
        style={{ left: `${i * 100 * zoom}px` }}
      >
        {i * 100}
      </div>
    ))}
  </div>
);
