import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { useKeyframeEditorCommands } from '../../hooks/useKeyframeEditorCommands';
import { Keyframe, Spritesheet, Animation, SpriteFrame } from '../../types/project';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineRuler } from './TimelineRuler';
import { KeyframeTrack } from './KeyframeTrack';
import { Playhead } from './Playhead';
import { useTranslation } from 'react-i18next';

const PIXELS_PER_MS_DEFAULT = 0.5;

export const KeyframeEditor: React.FC = () => {
  const { t } = useTranslation();
  const {
    project,
    activeItemId,
    activeItemType,
    activeSpritesheetId,
    activeFrameId,
    addKeyframe,
    updateKeyframe,
    removeKeyframe,
    addFrame,
    setActiveFrame,
    setActiveLayer,
  } = useProjectStore();

  const activeSheet = project?.spritesheets?.find((s: Spritesheet) => s.id === activeSpritesheetId);
  const animation = activeSheet?.animations?.find((a: Animation) => a.id === activeItemId);

  const { isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed, setPlaybackFrameId } = useEditorStore();
  const loopStart = useEditorStore((s) => s.loopStart);
  const loopEnd = useEditorStore((s) => s.loopEnd);
  const setLoopStart = useEditorStore((s) => s.setLoopStart);
  const setLoopEnd = useEditorStore((s) => s.setLoopEnd);
  const snapInterval = useEditorStore((s) => s.snapInterval);
  const setSnapInterval = useEditorStore((s) => s.setSnapInterval);
  const setFocusedView = useEditorStore((state) => state.setFocusedView);
  const [zoom, setZoom] = useState(PIXELS_PER_MS_DEFAULT);
  const [currentTime, setCurrentTime] = useState(0);

  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null);
  const [draggingMarker, setDraggingMarker] = useState<'A' | 'B' | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  const keyframes = animation?.keyframes || [];
  const maxKeyframeTime = keyframes.length > 0 ? Math.max(...keyframes.map((k: Keyframe) => k.time)) : 0;
  const maxTime = Math.max(1000, maxKeyframeTime) + 500;

  // Effective A-B range
  const effectiveStart = loopStart != null ? loopStart : 0;
  const effectiveEnd = loopEnd != null ? loopEnd : maxKeyframeTime + 100;

  const advancePlayhead = useCallback(
    (time: number) => {
      if (lastTimeRef.current != null && isPlaying) {
        const edState = useEditorStore.getState();
        const delta = (time - lastTimeRef.current) * playbackSpeed;
        const eStart = edState.loopStart != null ? edState.loopStart : 0;
        const eEnd = edState.loopEnd != null ? edState.loopEnd : maxKeyframeTime + 100;
        const range = eEnd - eStart;

        setCurrentTime((prev) => {
          let next: number;
          if (edState.loopMode === 'pingpong') {
            if (edState.pingpongReverse) {
              next = prev - delta;
              if (next <= eStart) {
                next = eStart;
                useEditorStore.getState().setPingpongReverse(false);
              }
            } else {
              next = prev + delta;
              if (next >= eEnd) {
                next = eEnd;
                useEditorStore.getState().setPingpongReverse(true);
              }
            }
          } else {
            next = prev + delta;
            if (next >= eEnd) {
              if (edState.loopMode === 'oneshot') {
                next = eEnd;
                useEditorStore.getState().setIsPlaying(false);
              } else {
                next = eStart + ((next - eStart) % range);
              }
            }
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      if (isPlaying) {
        requestRef.current = requestAnimationFrame(advancePlayhead);
      }
    },
    [isPlaying, maxKeyframeTime, playbackSpeed],
  );

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(advancePlayhead);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, advancePlayhead]);

  useEffect(() => {
    if (keyframes.length > 0) {
      let activeKf = keyframes[0];
      for (const kf of keyframes) {
        if (kf.time <= currentTime && kf.time > activeKf.time) {
          activeKf = kf;
        }
      }
      setPlaybackFrameId(activeKf.frameId);
    } else {
      setPlaybackFrameId(null);
    }
  }, [currentTime, keyframes, setPlaybackFrameId]);

  const handlePointerDown = (e: React.PointerEvent, keyframeId: string) => {
    e.stopPropagation();
    setDraggingKeyframeId(keyframeId);

    const kf = keyframes.find((k: Keyframe) => k.id === keyframeId);
    if (kf && kf.frameId) {
      setActiveFrame(kf.frameId);
      const sheet = project?.spritesheets?.find((s: Spritesheet) => s.id === activeSpritesheetId);
      const frame = sheet?.frames?.find((f: SpriteFrame) => f.id === kf.frameId);
      if (frame && frame.layers.length > 0) {
        useProjectStore.getState().setActiveLayer(frame.layers[frame.layers.length - 1].id);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isScrubbing && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
      let newTime = Math.max(0, x / zoom);
      if (snapInterval > 0) {
        newTime = Math.round(newTime / snapInterval) * snapInterval;
      } else {
        newTime = Math.round(newTime);
      }
      setCurrentTime(newTime);
      return;
    }

    if (draggingMarker && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
      let newTime = Math.max(0, x / zoom);
      if (snapInterval > 0) {
        newTime = Math.round(newTime / snapInterval) * snapInterval;
      } else {
        newTime = Math.round(newTime);
      }
      if (draggingMarker === 'A') {
        setLoopStart(newTime > 0 ? newTime : null);
      } else {
        setLoopEnd(newTime < maxTime - 100 ? newTime : null);
      }
      return;
    }

    if (!draggingKeyframeId || !timelineRef.current || !activeSpritesheetId || !activeItemId) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;

    let newTime = Math.max(0, x / zoom);
    if (snapInterval > 0) {
      newTime = Math.round(newTime / snapInterval) * snapInterval;
    } else {
      newTime = Math.round(newTime);
    }

    updateKeyframe(activeSpritesheetId, activeItemId, draggingKeyframeId, { time: newTime });
  };

  const handlePointerUp = () => {
    setDraggingKeyframeId(null);
    setDraggingMarker(null);
    setIsScrubbing(false);
  };

  const handleTimelineClick = (e: React.PointerEvent) => {
    if (draggingKeyframeId || draggingMarker || !timelineRef.current || !activeSpritesheetId || !activeItemId) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    let clickedTime = Math.max(0, x / zoom);

    if (snapInterval > 0) {
      clickedTime = Math.round(clickedTime / snapInterval) * snapInterval;
    } else {
      clickedTime = Math.round(clickedTime);
    }

    setCurrentTime(clickedTime);
    setIsScrubbing(true);
    setIsPlaying(false);
  };

  const handleAddKeyframeClick = () => {
    if (!activeSpritesheetId || !activeItemId || !activeSheet) return;

    const newLayer = {
      id: crypto.randomUUID(),
      name: 'Background',
      opacity: 1.0,
      blendMode: 'normal' as const,
      visible: true,
      locked: false,
      isReference: false,
      data: '',
    };

    const newFrame = {
      id: crypto.randomUUID(),
      layers: [newLayer],
    };

    addFrame(activeSpritesheetId, newFrame);

    const newKf: Keyframe = {
      id: crypto.randomUUID(),
      time: Math.round(currentTime),
      frameId: newFrame.id,
    };

    addKeyframe(activeSpritesheetId, activeItemId, newKf);
    setActiveFrame(newFrame.id);
    setActiveLayer(newLayer.id);
  };

  const handleDeleteKeyframe = (e: React.MouseEvent, keyframeId: string) => {
    e.stopPropagation();
    if (!activeSpritesheetId || !activeItemId) return;
    removeKeyframe(activeSpritesheetId, activeItemId, keyframeId);
  };

  // Register keyframe editor-scoped commands
  useKeyframeEditorCommands({
    onAddKeyframe: handleAddKeyframeClick,
  });

  if (activeItemType === 'image') {
    return (
      <div
        className="flex flex-col h-64 bg-slate-900 border-t border-slate-700 text-slate-300 select-none items-center justify-center"
        tabIndex={0}
        onFocus={() => setFocusedView('timeline')}
      >
        <span className="text-slate-500 text-sm">{t('timeline.disabled_for_images')}</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-64 bg-slate-900 border-t border-slate-700 text-slate-300 select-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset"
      tabIndex={0}
      onFocus={() => setFocusedView('timeline')}
    >
      <TimelineToolbar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={setPlaybackSpeed}
        onAddKeyframe={handleAddKeyframeClick}
        addDisabled={!activeItemId}
        animationName={animation?.name}
        currentTime={currentTime}
        snapInterval={snapInterval}
        onSnapIntervalChange={setSnapInterval}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <div
        className="flex-1 overflow-auto relative bg-slate-900 custom-scrollbar"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="relative h-full min-w-full"
          style={{ width: `${maxTime * zoom + 200}px` }}
          ref={timelineRef}
          onPointerDown={handleTimelineClick}
        >
          <TimelineRuler maxTime={maxTime} zoom={zoom} />

          <KeyframeTrack
            keyframes={keyframes}
            zoom={zoom}
            activeFrameId={activeFrameId}
            draggingKeyframeId={draggingKeyframeId}
            onPointerDown={handlePointerDown}
            onDeleteKeyframe={handleDeleteKeyframe}
          />

          {/* A-B Loop Markers */}
          {loopStart != null && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize z-30 hover:bg-green-400"
              style={{ left: `${loopStart * zoom}px` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingMarker('A');
              }}
              title="Loop Start (A)"
            >
              <div className="absolute -top-0 -left-1 w-3 text-[8px] font-bold text-green-400 select-none">A</div>
            </div>
          )}
          {loopEnd != null && (
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-400 cursor-ew-resize z-30 hover:bg-red-300"
              style={{ left: `${loopEnd * zoom}px` }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setDraggingMarker('B');
              }}
              title="Loop End (B)"
            >
              <div className="absolute -top-0 -left-1 w-3 text-[8px] font-bold text-red-400 select-none">B</div>
            </div>
          )}
          {/* Dimmed regions outside A-B range */}
          {(loopStart != null || loopEnd != null) && (
            <>
              {effectiveStart > 0 && (
                <div
                  className="absolute top-0 bottom-0 left-0 bg-black/30 pointer-events-none"
                  style={{ width: `${effectiveStart * zoom}px` }}
                />
              )}
              {loopEnd != null && (
                <div
                  className="absolute top-0 bottom-0 bg-black/30 pointer-events-none"
                  style={{ left: `${effectiveEnd * zoom}px`, right: 0 }}
                />
              )}
            </>
          )}

          <Playhead currentTime={currentTime} zoom={zoom} />
        </div>
      </div>
    </div>
  );
};
