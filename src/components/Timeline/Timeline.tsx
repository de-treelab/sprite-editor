import React, { useCallback, useEffect, useRef } from 'react';
import { useEditorStore, LoopMode } from '../../store/editorStore';
import { useProjectStore } from '../../store/projectStore';
import { useTimelineCommands } from '../../hooks/useTimelineCommands';
import { SpeedButtonGroup, IconButton } from '../ui';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';
import type { IconType } from 'react-icons';

const loopModeIcons: Record<LoopMode, IconType> = {
  loop: IconRegistry.Repeat,
  oneshot: IconRegistry.RepeatOne,
  pingpong: IconRegistry.Repeat,
};

const loopModeLabels: Record<LoopMode, string> = {
  loop: 'Loop',
  oneshot: 'One-shot',
  pingpong: 'Ping-pong',
};

export const Timeline: React.FC = () => {
  const { t } = useTranslation();
  const { isPlaying, playbackTime, playbackSpeed, setIsPlaying, setPlaybackTime, setPlaybackSpeed } = useEditorStore();
  const loopMode = useEditorStore(s => s.loopMode);
  const setLoopMode = useEditorStore(s => s.setLoopMode);
  const loopStart = useEditorStore(s => s.loopStart);
  const loopEnd = useEditorStore(s => s.loopEnd);
  const setFocusedView = useEditorStore((state) => state.setFocusedView);
  const { activeSpritesheetId, activeItemId, activeItemType, project, setActiveFrame } = useProjectStore();

  // Register timeline-scoped commands
  useTimelineCommands();

  const lastUpdateRef = useRef<number>(performance.now());
  const requestRef = useRef<number>(0);
  const timelineBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const scrubToClientX = useCallback((clientX: number) => {
    const bar = timelineBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const proj = useProjectStore.getState();
    const sh = proj.project?.spritesheets.find(s => s.id === proj.activeSpritesheetId);
    const an = sh?.animations.find(a => a.id === proj.activeItemId);
    const kfs = an?.keyframes ? [...an.keyframes].sort((a, b) => a.time - b.time) : [];
    const dur = kfs.length > 0 ? kfs[kfs.length - 1].time + 100 : 0;
    if (dur <= 0) return;
    const newTime = fraction * dur;
    useEditorStore.getState().setPlaybackTime(newTime);
    // Sync active frame
    for (let i = kfs.length - 1; i >= 0; i--) {
      if (newTime >= kfs[i].time) {
        if (proj.activeFrameId !== kfs[i].frameId) {
          useProjectStore.getState().setActiveFrame(kfs[i].frameId);
        }
        break;
      }
    }
  }, []);

  const handleTimelinePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsPlaying(false);
    scrubToClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scrubToClientX, setIsPlaying]);

  const handleTimelinePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    scrubToClientX(e.clientX);
  }, [scrubToClientX]);

  const handleTimelinePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const sheet = project?.spritesheets.find(s => s.id === activeSpritesheetId);
  const anim = sheet?.animations.find(a => a.id === activeItemId);
  const isReferenceImage = activeItemType === 'image';
  const keyframes = anim?.keyframes ? [...anim.keyframes].sort((a,b) => a.time - b.time) : [];

  const totalDuration = keyframes.length > 0 ? keyframes[keyframes.length - 1].time + 100 : 0;

  // Effective loop range
  const effectiveStart = loopStart != null ? loopStart : 0;
  const effectiveEnd = loopEnd != null ? loopEnd : totalDuration;

  useEffect(() => {
    const loop = (time: number) => {
      const edState = useEditorStore.getState();
      if (edState.isPlaying && totalDuration > 0) {
        const currentSpeed = edState.playbackSpeed;
        const delta = time - lastUpdateRef.current;
        const lm = edState.loopMode;
        const eStart = edState.loopStart != null ? edState.loopStart : 0;
        const eEnd = edState.loopEnd != null ? edState.loopEnd : totalDuration;
        const range = eEnd - eStart;

        let newTime = edState.playbackTime;

        if (lm === 'pingpong') {
          const reverse = edState.pingpongReverse;
          if (reverse) {
            newTime -= delta * currentSpeed;
            if (newTime <= eStart) {
              newTime = eStart;
              useEditorStore.getState().setPingpongReverse(false);
            }
          } else {
            newTime += delta * currentSpeed;
            if (newTime >= eEnd) {
              newTime = eEnd;
              useEditorStore.getState().setPingpongReverse(true);
            }
          }
        } else {
          newTime += delta * currentSpeed;
          if (newTime >= eEnd) {
            if (lm === 'oneshot') {
              newTime = eEnd;
              useEditorStore.getState().setIsPlaying(false);
            } else {
              // loop
              newTime = eStart + ((newTime - eStart) % range);
            }
          }
        }

        useEditorStore.getState().setPlaybackTime(newTime);

        const kfs = (useProjectStore.getState().project?.spritesheets.find(s => s.id === useProjectStore.getState().activeSpritesheetId)?.animations.find(a => a.id === useProjectStore.getState().activeItemId)?.keyframes || []).sort((a,b) => a.time - b.time);

        for (let i = kfs.length - 1; i >= 0; i--) {
            if (newTime >= kfs[i].time) {
                if (useProjectStore.getState().activeFrameId !== kfs[i].frameId) {
                    useProjectStore.getState().setActiveFrame(kfs[i].frameId);
                }
                break;
            }
        }
      }
      lastUpdateRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };

    lastUpdateRef.current = performance.now();
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [totalDuration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    lastUpdateRef.current = performance.now();
  };

  const cycleLoopMode = () => {
    const modes: LoopMode[] = ['loop', 'oneshot', 'pingpong'];
    const idx = modes.indexOf(loopMode);
    setLoopMode(modes[(idx + 1) % modes.length]);
  };

  const stepPrev = () => {
    if (keyframes.length === 0) return;
    for (let i = keyframes.length - 1; i >= 0; i--) {
      if (keyframes[i].time < playbackTime - 0.5) {
        setPlaybackTime(keyframes[i].time);
        setActiveFrame(keyframes[i].frameId);
        setIsPlaying(false);
        return;
      }
    }
    // Wrap to last
    setPlaybackTime(keyframes[keyframes.length - 1].time);
    setActiveFrame(keyframes[keyframes.length - 1].frameId);
    setIsPlaying(false);
  };

  const stepNext = () => {
    if (keyframes.length === 0) return;
    const next = keyframes.find(k => k.time > playbackTime + 0.5);
    if (next) {
      setPlaybackTime(next.time);
      setActiveFrame(next.frameId);
    } else {
      setPlaybackTime(keyframes[0].time);
      setActiveFrame(keyframes[0].frameId);
    }
    setIsPlaying(false);
  };

  const LoopIcon = loopModeIcons[loopMode];

  if (isReferenceImage) {
    return (
      <div
        className="h-48 bg-slate-800 border-t border-slate-700 flex flex-col items-center justify-center focus:outline-none"
        tabIndex={0}
        onFocus={() => setFocusedView('timeline')}
      >
        <span className="text-slate-500 text-sm">{t('timeline.disabled_for_images')}</span>
      </div>
    );
  }

  return (
    <div
      className="h-48 bg-slate-800 border-t border-slate-700 flex flex-col focus:outline-none focus:ring-2 focus:ring-indigo-500"
      tabIndex={0}
      onFocus={() => setFocusedView('timeline')}
    >
      <div className="flex px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-300">
        <span className="font-bold flex items-center gap-2">
          {t('timeline.title')}
          {anim && <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded-full">{anim.name}</span>}
        </span>
        <div className="ml-auto flex space-x-4 items-center">
          <span className="mr-2 text-slate-400 font-mono">
            {Math.floor(playbackTime).toString().padStart(4, '0')} / {totalDuration}ms
          </span>

          <div className="flex items-center gap-1">
            <IconButton
              icon={IconRegistry.StepBack}
              size="sm"
              onClick={stepPrev}
              label="Step Back"
            />
            <IconButton
              icon={IconRegistry.SkipBack}
              size="sm"
              onClick={() => { setIsPlaying(false); setPlaybackTime(0); }}
              label="Reset"
            />
            <IconButton
              icon={isPlaying ? IconRegistry.Pause : IconRegistry.Play}
              size="sm"
              onClick={togglePlay}
              label={isPlaying ? t('timeline.pause') : t('timeline.play')}
            />
            <IconButton
              icon={IconRegistry.SkipForward}
              size="sm"
              onClick={stepNext}
              label="Next"
            />
            <IconButton
              icon={IconRegistry.StepForward}
              size="sm"
              onClick={stepNext}
              label="Step Forward"
            />
          </div>

          <IconButton
            icon={LoopIcon}
            size="sm"
            onClick={cycleLoopMode}
            label={loopModeLabels[loopMode]}
            className={loopMode === 'pingpong' ? 'text-yellow-400' : loopMode === 'oneshot' ? 'text-orange-400' : ''}
          />

          <SpeedButtonGroup
            value={playbackSpeed}
            onChange={setPlaybackSpeed}
            className="ml-2"
          />
        </div>
      </div>
      <div className="flex-1 p-4 relative overflow-x-auto">
        <div
          ref={timelineBarRef}
          className="relative h-12 w-full border border-slate-600 rounded bg-slate-900 flex items-center p-2 cursor-pointer"
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={handleTimelinePointerUp}
          onPointerCancel={handleTimelinePointerUp}
        >
          {/* A-B loop markers */}
          {loopStart != null && totalDuration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-green-500/20 border-l-2 border-green-500 z-5 pointer-events-none"
              style={{ left: `${(loopStart / totalDuration) * 100}%`, width: 0 }}
            />
          )}
          {loopEnd != null && totalDuration > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-red-500/20 border-r-2 border-red-500 z-5 pointer-events-none"
              style={{ left: `${(loopEnd / totalDuration) * 100}%`, width: 0 }}
            />
          )}
          {/* Dimmed regions outside A-B range */}
          {(loopStart != null || loopEnd != null) && totalDuration > 0 && (
            <>
              {effectiveStart > 0 && (
                <div
                  className="absolute top-0 bottom-0 left-0 bg-black/30 z-4 pointer-events-none"
                  style={{ width: `${(effectiveStart / totalDuration) * 100}%` }}
                />
              )}
              {effectiveEnd < totalDuration && (
                <div
                  className="absolute top-0 bottom-0 right-0 bg-black/30 z-4 pointer-events-none"
                  style={{ width: `${((totalDuration - effectiveEnd) / totalDuration) * 100}%` }}
                />
              )}
            </>
          )}
          {keyframes.map(kf => {
            const left = (kf.time / totalDuration) * 100;
            return (
              <div
                key={kf.id}
                className={`absolute w-3 h-8 -ml-1.5 rounded-sm flex items-center justify-center cursor-pointer hover:border-white ${
                  kf.frameId === useProjectStore.getState().activeFrameId
                    ? 'bg-indigo-500 border border-white z-10'
                    : 'bg-slate-600 border border-slate-500'
                }`}
                style={{ left: `${left}%` }}
                onClick={() => {
                  setPlaybackTime(kf.time);
                  setActiveFrame(kf.frameId);
                  setIsPlaying(false);
                }}
              />
            );
          })}
          {/* Playhead */}
          {totalDuration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
              style={{ left: `${(playbackTime / totalDuration) * 100}%` }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45 transform origin-bottom pointer-events-auto cursor-grab" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
