import { useEffect } from 'react';
import { registerCommandProvider, Command } from '../config/commandRegistry';
import { useProjectStore } from '../store/projectStore';

/**
 * Registers a command provider that generates dynamic commands
 * based on the current project state (spritesheets, animations).
 * Call once in App.tsx.
 */
export function useProjectCommands() {
  useEffect(() => {
    const provider = (): Command[] => {
      const { project, setActiveSpritesheet, setActiveItem } = useProjectStore.getState();
      if (!project) return [];

      const commands: Command[] = [];

      for (const sheet of project.spritesheets) {
        commands.push({
          key: `project.openSpritesheet.${sheet.id}`,
          view: 'global',
          displayName: `Open Spritesheet: ${sheet.name}`,
          handler: () => setActiveSpritesheet(sheet.id),
        });

        for (const anim of sheet.animations) {
          commands.push({
            key: `project.openAnimation.${sheet.id}.${anim.id}`,
            view: 'global',
            displayName: `Open Animation: ${anim.name}`,
            handler: () => {
              setActiveSpritesheet(sheet.id);
              setActiveItem(anim.id, 'animation');
            },
          });
        }
      }

      return commands;
    };

    const unregister = registerCommandProvider(provider);
    return unregister;
  }, []);
}
