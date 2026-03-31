import { useEffect } from 'react';
import { registerCommand, unregisterCommand } from '../config/commandRegistry';
import { useEditorStore } from '../store/editorStore';
import { useSettingsStore } from '../store/settingsStore';
import { IconRegistry } from '../components/IconRegistry';
import { useHistoryStore } from '../store/historyStore';

/**
 * Registers all static global commands: view focus, file ops, edit ops, settings.
 * Call once in App.tsx. Pass handler callbacks for operations that
 * live in component state (open project, new project, save…).
 */
export function useGlobalCommands(handlers: {
  onNewProject?: () => void;
  onOpen?: () => void;
  onSave?: () => void;
  onOpenCommandPalette?: () => void;
}) {
  const setFocusedView = useEditorStore((s) => s.setFocusedView);
  const toggleHiddenView = useEditorStore((s) => s.toggleHiddenView);
  const toggleFullscreenView = useEditorStore((s) => s.toggleFullscreenView);
  const openSettings = useSettingsStore((s) => s.openSettings);

  useEffect(() => {
    // View focus commands
    registerCommand({
      key: 'global.focusCanvas',
      view: 'global',
      handler: () => setFocusedView('canvas'),
    });
    registerCommand({
      key: 'global.focusTimeline',
      view: 'global',
      handler: () => setFocusedView('timeline'),
    });
    registerCommand({
      key: 'global.focusPreview',
      view: 'global',
      handler: () => setFocusedView('preview'),
    });
    registerCommand({
      key: 'global.focusNavigator',
      view: 'global',
      handler: () => setFocusedView('navigator'),
    });

    // View hide commands
    registerCommand({
      key: 'global.hideCanvas',
      view: 'global',
      handler: () => toggleHiddenView('canvas'),
    });
    registerCommand({
      key: 'global.hideTimeline',
      view: 'global',
      handler: () => toggleHiddenView('timeline'),
    });
    registerCommand({
      key: 'global.hidePreview',
      view: 'global',
      handler: () => toggleHiddenView('preview'),
    });
    registerCommand({
      key: 'global.hideNavigator',
      view: 'global',
      handler: () => toggleHiddenView('navigator'),
    });

    // View fullscreen commands
    registerCommand({
      key: 'global.fullscreenCanvas',
      view: 'global',
      handler: () => toggleFullscreenView('canvas'),
    });
    registerCommand({
      key: 'global.fullscreenTimeline',
      view: 'global',
      handler: () => toggleFullscreenView('timeline'),
    });
    registerCommand({
      key: 'global.fullscreenPreview',
      view: 'global',
      handler: () => toggleFullscreenView('preview'),
    });
    registerCommand({
      key: 'global.fullscreenNavigator',
      view: 'global',
      handler: () => toggleFullscreenView('navigator'),
    });

    // Settings
    registerCommand({
      key: 'global.openSettings',
      view: 'global',
      icon: IconRegistry.Settings,
      handler: () => openSettings(),
    });

    return () => {
      unregisterCommand('global.focusCanvas');
      unregisterCommand('global.focusTimeline');
      unregisterCommand('global.focusPreview');
      unregisterCommand('global.focusNavigator');
      unregisterCommand('global.hideCanvas');
      unregisterCommand('global.hideTimeline');
      unregisterCommand('global.hidePreview');
      unregisterCommand('global.hideNavigator');
      unregisterCommand('global.fullscreenCanvas');
      unregisterCommand('global.fullscreenTimeline');
      unregisterCommand('global.fullscreenPreview');
      unregisterCommand('global.fullscreenNavigator');
      unregisterCommand('global.openSettings');
    };
  }, [setFocusedView, toggleHiddenView, toggleFullscreenView, openSettings]);

  // File / edit commands — re-register when handlers change
  useEffect(() => {
    registerCommand({
      key: 'global.saveProject',
      view: 'global',
      icon: IconRegistry.Save,
      handler: () => handlers.onSave?.(),
    });
    registerCommand({
      key: 'global.openProject',
      view: 'global',
      icon: IconRegistry.FolderOpen,
      handler: () => handlers.onOpen?.(),
    });
    registerCommand({
      key: 'global.newProject',
      view: 'global',
      icon: IconRegistry.Folder,
      handler: () => handlers.onNewProject?.(),
    });
    registerCommand({
      key: 'global.undo',
      view: 'global',
      icon: IconRegistry.Undo,
      enabled: () => useHistoryStore.getState().canUndo,
      handler: () => useHistoryStore.getState().undo(),
    });
    registerCommand({
      key: 'global.redo',
      view: 'global',
      icon: IconRegistry.Redo,
      enabled: () => useHistoryStore.getState().canRedo,
      handler: () => useHistoryStore.getState().redo(),
    });
    registerCommand({
      key: 'global.openCommandPalette',
      view: 'global',
      handler: () => handlers.onOpenCommandPalette?.(),
    });

    return () => {
      unregisterCommand('global.saveProject');
      unregisterCommand('global.openProject');
      unregisterCommand('global.newProject');
      unregisterCommand('global.undo');
      unregisterCommand('global.redo');
      unregisterCommand('global.openCommandPalette');
    };
  }, [handlers.onSave, handlers.onOpen, handlers.onNewProject, handlers.onOpenCommandPalette]);
}
