import { useEffect } from 'react';
import { registerCommand, unregisterCommand } from '../config/commandRegistry';
import { useSettingsStore } from '../store/settingsStore';
import { useLayoutStore } from '../store/layoutStore';
import { useEditorStore } from '../store/editorStore';
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
  onSaveWithoutTask?: () => void;
  onOpenCommandPalette?: () => void;
  onSaveLayout?: () => void;
  onManageLayouts?: () => void;
  onOpenWiki?: () => void;
}) {
  const toggleViewHidden = useLayoutStore((s) => s.toggleViewHidden);
  const setFullscreenView = useLayoutStore((s) => s.setFullscreenView);
  const layout = useLayoutStore((s) => s.layout);
  const openSettings = useSettingsStore((s) => s.openSettings);

  useEffect(() => {
    const setFocusedView = useEditorStore.getState().setFocusedView;

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
      handler: () => toggleViewHidden('canvas'),
    });
    registerCommand({
      key: 'global.hideTimeline',
      view: 'global',
      handler: () => toggleViewHidden('timeline'),
    });
    registerCommand({
      key: 'global.hidePreview',
      view: 'global',
      handler: () => toggleViewHidden('preview'),
    });
    registerCommand({
      key: 'global.hideNavigator',
      view: 'global',
      handler: () => toggleViewHidden('navigator'),
    });

    // View fullscreen commands
    registerCommand({
      key: 'global.fullscreenCanvas',
      view: 'global',
      handler: () => setFullscreenView(layout.fullscreenViewId === 'canvas' ? null : 'canvas'),
    });
    registerCommand({
      key: 'global.fullscreenTimeline',
      view: 'global',
      handler: () => setFullscreenView(layout.fullscreenViewId === 'timeline' ? null : 'timeline'),
    });
    registerCommand({
      key: 'global.fullscreenPreview',
      view: 'global',
      handler: () => setFullscreenView(layout.fullscreenViewId === 'preview' ? null : 'preview'),
    });
    registerCommand({
      key: 'global.fullscreenNavigator',
      view: 'global',
      handler: () => setFullscreenView(layout.fullscreenViewId === 'navigator' ? null : 'navigator'),
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
  }, [toggleViewHidden, setFullscreenView, layout.fullscreenViewId, openSettings]);

  // File / edit commands — re-register when handlers change
  useEffect(() => {
    registerCommand({
      key: 'global.saveProject',
      view: 'global',
      icon: IconRegistry.Save,
      handler: () => handlers.onSave?.(),
    });
    registerCommand({
      key: 'global.saveProjectWithoutTask',
      view: 'global',
      icon: IconRegistry.Save,
      handler: () => handlers.onSaveWithoutTask?.(),
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
      unregisterCommand('global.saveProjectWithoutTask');
      unregisterCommand('global.openProject');
      unregisterCommand('global.newProject');
      unregisterCommand('global.undo');
      unregisterCommand('global.redo');
      unregisterCommand('global.openCommandPalette');
    };
  }, [
    handlers.onSave,
    handlers.onSaveWithoutTask,
    handlers.onOpen,
    handlers.onNewProject,
    handlers.onOpenCommandPalette,
  ]);

  // Layout commands
  const resetLayout = useLayoutStore((s) => s.resetLayout);

  useEffect(() => {
    registerCommand({
      key: 'global.resetLayout',
      view: 'global',
      icon: IconRegistry.Layout,
      handler: () => resetLayout(),
    });
    registerCommand({
      key: 'global.saveLayout',
      view: 'global',
      icon: IconRegistry.Save,
      handler: () => handlers.onSaveLayout?.(),
    });
    registerCommand({
      key: 'global.manageLayouts',
      view: 'global',
      icon: IconRegistry.Layout,
      handler: () => handlers.onManageLayouts?.(),
    });
    registerCommand({
      key: 'global.openWiki',
      view: 'global',
      icon: IconRegistry.Wiki,
      handler: () => handlers.onOpenWiki?.(),
    });

    return () => {
      unregisterCommand('global.resetLayout');
      unregisterCommand('global.saveLayout');
      unregisterCommand('global.manageLayouts');
      unregisterCommand('global.openWiki');
    };
  }, [resetLayout, handlers.onSaveLayout, handlers.onManageLayouts, handlers.onOpenWiki]);
}
