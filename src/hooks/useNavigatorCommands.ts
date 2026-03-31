import { useEffect } from 'react';
import { registerCommand, unregisterCommand } from '../config/commandRegistry';
import { IconRegistry } from '../components/IconRegistry';

/**
 * Registers navigator-scoped commands: frame and layer CRUD.
 * Call in RightSidebar (where the handler callbacks exist).
 */
export function useNavigatorCommands(handlers: {
  onNewFrame?: () => void;
  onDeleteFrame?: () => void;
  onDuplicateFrame?: () => void;
  onNewLayer?: () => void;
  onDeleteLayer?: () => void;
}) {
  useEffect(() => {
    registerCommand({
      key: 'navigator.newFrame',
      view: 'navigator',
      icon: IconRegistry.Add,
      handler: () => handlers.onNewFrame?.(),
    });
    registerCommand({
      key: 'navigator.deleteFrame',
      view: 'navigator',
      icon: IconRegistry.Delete,
      handler: () => handlers.onDeleteFrame?.(),
    });
    registerCommand({
      key: 'navigator.duplicateFrame',
      view: 'navigator',
      handler: () => handlers.onDuplicateFrame?.(),
    });
    registerCommand({
      key: 'navigator.newLayer',
      view: 'navigator',
      icon: IconRegistry.Add,
      handler: () => handlers.onNewLayer?.(),
    });
    registerCommand({
      key: 'navigator.deleteLayer',
      view: 'navigator',
      icon: IconRegistry.Delete,
      handler: () => handlers.onDeleteLayer?.(),
    });

    return () => {
      for (const key of [
        'navigator.newFrame', 'navigator.deleteFrame', 'navigator.duplicateFrame',
        'navigator.newLayer', 'navigator.deleteLayer',
      ]) {
        unregisterCommand(key);
      }
    };
  }, [handlers.onNewFrame, handlers.onDeleteFrame, handlers.onDuplicateFrame, handlers.onNewLayer, handlers.onDeleteLayer]);
}
