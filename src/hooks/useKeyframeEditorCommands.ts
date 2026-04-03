import { useEffect } from 'react';
import { registerCommand, unregisterCommand } from '../config/commandRegistry';
import { IconRegistry } from '../components/IconRegistry';

/**
 * Registers keyframe-editor-scoped commands.
 * Call in KeyframeEditor component.
 */
export function useKeyframeEditorCommands(handlers: {
  onAddKeyframe?: () => void;
  onDeleteKeyframe?: () => void;
  onDuplicateKeyframe?: () => void;
}) {
  useEffect(() => {
    registerCommand({
      key: 'timeline.addKeyframe',
      view: 'timeline',
      icon: IconRegistry.Add,
      handler: () => handlers.onAddKeyframe?.(),
    });
    registerCommand({
      key: 'timeline.deleteKeyframe',
      view: 'timeline',
      icon: IconRegistry.Delete,
      handler: () => handlers.onDeleteKeyframe?.(),
    });
    registerCommand({
      key: 'timeline.duplicateKeyframe',
      view: 'timeline',
      handler: () => handlers.onDuplicateKeyframe?.(),
    });

    return () => {
      for (const key of ['timeline.addKeyframe', 'timeline.deleteKeyframe', 'timeline.duplicateKeyframe']) {
        unregisterCommand(key);
      }
    };
  }, [handlers.onAddKeyframe, handlers.onDeleteKeyframe, handlers.onDuplicateKeyframe]);
}
