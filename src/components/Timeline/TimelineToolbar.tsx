import React from 'react';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';
import { useEditorStore, LoopMode } from '../../store/editorStore';
import { IconButton, Button, SpeedButtonGroup, Select, RangeSlider } from '../ui';

const snapOptions = [
  { value: '0', label: 'None' },
  { value: '10', label: '10ms' },
  { value: '20', label: '20ms' },
  { value: '50', label: '50ms' },
  { value: '100', label: '100ms' },
];

const loopModeLabels: Record<LoopMode, string> = {
  loop: 'Loop',
  oneshot: 'One-shot',
  pingpong: 'Ping-pong',
};

interface TimelineToolbarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  onAddKeyframe: () => void;
  addDisabled: boolean;
  animationName: string | undefined;
  currentTime: number;
  snapInterval: number;
  onSnapIntervalChange: (interval: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onPlaybackSpeedChange,
  onAddKeyframe,
  addDisabled,
  animationName,
  currentTime,
  snapInterval,
  onSnapIntervalChange,
  zoom,
  onZoomChange,
}) => {
  const { t } = useTranslation();
  const loopMode = useEditorStore(s => s.loopMode);
  const setLoopMode = useEditorStore(s => s.setLoopMode);
  const loopStart = useEditorStore(s => s.loopStart);
  const loopEnd = useEditorStore(s => s.loopEnd);
  const setLoopStart = useEditorStore(s => s.setLoopStart);
  const setLoopEnd = useEditorStore(s => s.setLoopEnd);

  const cycleLoopMode = () => {
    const modes: LoopMode[] = ['loop', 'oneshot', 'pingpong'];
    const idx = modes.indexOf(loopMode);
    setLoopMode(modes[(idx + 1) % modes.length]);
  };

  const setMarkerA = () => {
    setLoopStart(Math.max(0, Math.round(currentTime)));
  };

  const setMarkerB = () => {
    setLoopEnd(Math.max(0, Math.round(currentTime)));
  };

  const LoopIcon = loopMode === 'oneshot' ? IconRegistry.RepeatOne :
                   loopMode === 'pingpong' ? IconRegistry.Repeat : IconRegistry.Repeat;

  return (
    <div className="flex items-center px-4 h-12 bg-slate-800 border-b border-slate-700 gap-4 shrink-0">
      <IconButton
        icon={isPlaying ? IconRegistry.Pause : IconRegistry.Play}
        onClick={onTogglePlay}
        label={isPlaying ? t('timeline.pause') : t('timeline.play')}
      />

      {/* Loop mode toggle */}
      <IconButton
        icon={LoopIcon}
        onClick={cycleLoopMode}
        label={loopModeLabels[loopMode]}
        className={loopMode === 'pingpong' ? 'text-yellow-400' : loopMode === 'oneshot' ? 'text-orange-400' : ''}
      />

      <SpeedButtonGroup
        value={playbackSpeed}
        onChange={onPlaybackSpeedChange}
      />

      <Button
        variant="primary"
        size="sm"
        onClick={onAddKeyframe}
        disabled={addDisabled}
      >
        <IconRegistry.Add size={14} className="mr-1" /> {t('timeline.add')}
      </Button>

      <div className="text-sm text-slate-400 font-mono ml-4 border-l border-slate-700 pl-4 w-48 truncate">
        {animationName || t('timeline.no_animation', 'No Animation')}
      </div>
      <div className="text-sm text-indigo-400 font-mono w-24">
        {Math.round(currentTime)}ms
      </div>

      {/* A-B loop controls */}
      <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
        <button
          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${loopStart != null ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
          onClick={setMarkerA}
          title={t('timeline.set_loop_start')}
        >A</button>
        <button
          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${loopEnd != null ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
          onClick={setMarkerB}
          title={t('timeline.set_loop_end')}
        >B</button>
        {(loopStart != null || loopEnd != null) && (
          <button
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 hover:text-red-300"
            onClick={() => { setLoopStart(null); setLoopEnd(null); }}
            title={t('timeline.clear_ab_loop')}
          >✕</button>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">{t('timeline.snap')}</span>
          <Select
            value={String(snapInterval)}
            onChange={(e) => onSnapIntervalChange(parseInt(e.target.value, 10))}
            options={snapOptions}
            size="sm"
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">{t('common.zoom')}</span>
          <RangeSlider
            value={zoom}
            onChange={onZoomChange}
            min={0.1}
            max={2}
            step={0.1}
            showValue={false}
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
};
