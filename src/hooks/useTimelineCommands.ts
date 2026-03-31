import { useEffect } from 'react';
import { registerCommand, unregisterCommand } from '../config/commandRegistry';
import { useEditorStore, LoopMode } from '../store/editorStore';
import { useProjectStore } from '../store/projectStore';
import { IconRegistry } from '../components/IconRegistry';

/** Get sorted keyframes for the active animation. */
function getActiveKeyframes() {
  const pState = useProjectStore.getState();
  const sheet = pState.project?.spritesheets.find(s => s.id === pState.activeSpritesheetId);
  const anim = sheet?.animations.find(a => a.id === pState.activeAnimationId);
  return anim?.keyframes ? [...anim.keyframes].sort((a, b) => a.time - b.time) : [];
}

/**
 * Registers timeline-scoped commands: play/pause, stop, step, loop mode.
 * Call in the Timeline component.
 */
export function useTimelineCommands() {
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setPlaybackTime = useEditorStore((s) => s.setPlaybackTime);

  useEffect(() => {
    registerCommand({
      key: 'timeline.playPause',
      view: 'timeline',
      icon: IconRegistry.Play,
      handler: () => {
        const playing = useEditorStore.getState().isPlaying;
        setIsPlaying(!playing);
      },
    });
    registerCommand({
      key: 'timeline.stop',
      view: 'timeline',
      handler: () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      },
    });
    registerCommand({
      key: 'timeline.nextFrame',
      view: 'timeline',
      icon: IconRegistry.SkipForward,
      handler: () => {
        const kfs = getActiveKeyframes();
        if (kfs.length === 0) return;
        const current = useEditorStore.getState().playbackTime;
        const next = kfs.find(k => k.time > current + 0.5);
        if (next) {
          setPlaybackTime(next.time);
          useProjectStore.getState().setActiveFrame(next.frameId);
        } else {
          // Wrap to first keyframe
          setPlaybackTime(kfs[0].time);
          useProjectStore.getState().setActiveFrame(kfs[0].frameId);
        }
        setIsPlaying(false);
      },
    });
    registerCommand({
      key: 'timeline.prevFrame',
      view: 'timeline',
      icon: IconRegistry.SkipBack,
      handler: () => {
        const kfs = getActiveKeyframes();
        if (kfs.length === 0) return;
        const current = useEditorStore.getState().playbackTime;
        // Find the keyframe before the current time
        let prev = kfs[kfs.length - 1];
        for (let i = kfs.length - 1; i >= 0; i--) {
          if (kfs[i].time < current - 0.5) {
            prev = kfs[i];
            break;
          }
        }
        setPlaybackTime(prev.time);
        useProjectStore.getState().setActiveFrame(prev.frameId);
        setIsPlaying(false);
      },
    });
    registerCommand({
      key: 'timeline.stepForward',
      view: 'timeline',
      icon: IconRegistry.StepForward,
      handler: () => {
        const kfs = getActiveKeyframes();
        if (kfs.length === 0) return;
        const current = useEditorStore.getState().playbackTime;
        const next = kfs.find(k => k.time > current + 0.5);
        if (next) {
          setPlaybackTime(next.time);
          useProjectStore.getState().setActiveFrame(next.frameId);
        }
        setIsPlaying(false);
      },
    });
    registerCommand({
      key: 'timeline.stepBackward',
      view: 'timeline',
      icon: IconRegistry.StepBack,
      handler: () => {
        const kfs = getActiveKeyframes();
        if (kfs.length === 0) return;
        const current = useEditorStore.getState().playbackTime;
        for (let i = kfs.length - 1; i >= 0; i--) {
          if (kfs[i].time < current - 0.5) {
            setPlaybackTime(kfs[i].time);
            useProjectStore.getState().setActiveFrame(kfs[i].frameId);
            break;
          }
        }
        setIsPlaying(false);
      },
    });
    registerCommand({
      key: 'timeline.toggleLoopMode',
      view: 'timeline',
      icon: IconRegistry.Repeat,
      handler: () => {
        const modes: LoopMode[] = ['loop', 'oneshot', 'pingpong'];
        const current = useEditorStore.getState().loopMode;
        const idx = modes.indexOf(current);
        useEditorStore.getState().setLoopMode(modes[(idx + 1) % modes.length]);
      },
    });

    return () => {
      for (const key of [
        'timeline.playPause', 'timeline.stop', 'timeline.nextFrame', 'timeline.prevFrame',
        'timeline.stepForward', 'timeline.stepBackward', 'timeline.toggleLoopMode',
      ]) {
        unregisterCommand(key);
      }
    };
  }, [setIsPlaying, setPlaybackTime]);
}
