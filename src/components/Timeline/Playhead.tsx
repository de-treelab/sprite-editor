import React from 'react';

interface PlayheadProps {
  currentTime: number;
  zoom: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ currentTime, zoom }) => (
  <div
    className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-20"
    style={{ left: `${currentTime * zoom}px` }}
  >
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
  </div>
);
