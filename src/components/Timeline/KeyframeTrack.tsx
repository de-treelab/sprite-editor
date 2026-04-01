import React from 'react';
import { Keyframe } from '../../types/project';

interface KeyframeTrackProps {
  keyframes: Keyframe[];
  zoom: number;
  activeFrameId: string | null;
  draggingKeyframeId: string | null;
  onPointerDown: (e: React.PointerEvent, keyframeId: string) => void;
  onDeleteKeyframe: (e: React.MouseEvent, keyframeId: string) => void;
}

export const KeyframeTrack: React.FC<KeyframeTrackProps> = ({
  keyframes,
  zoom,
  activeFrameId,
  draggingKeyframeId,
  onPointerDown,
  onDeleteKeyframe,
}) => (
  <div className="absolute top-6 bottom-4 left-0 right-0 flex">
    <div className="w-full h-10 bg-slate-800/30 rounded flex relative border-y border-slate-800">
      {keyframes.map((k: Keyframe) => (
        <div
          key={k.id}
          onPointerDown={(e) => onPointerDown(e, k.id)}
          onContextMenu={(e) => { e.preventDefault(); onDeleteKeyframe(e, k.id); }}
          className={`absolute top-1 bottom-1 w-3 rounded-sm transform -translate-x-1/2 cursor-ew-resize flex items-center justify-center transition-all ${
            draggingKeyframeId === k.id
              ? 'bg-indigo-400 ring-2 ring-indigo-200 z-10 scale-110'
              : k.frameId === activeFrameId
                ? 'bg-amber-500 ring-2 ring-amber-300/50 z-10 scale-105'
                : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
          style={{ left: `${k.time * zoom}px` }}
          title={`${k.time}ms (Right-click to delete)`}
        >
          <div className="w-0.5 h-4 bg-white/50 rounded-full pointer-events-none" />
        </div>
      ))}
    </div>
  </div>
);
