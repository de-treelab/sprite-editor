import { IconType } from 'react-icons';
import { ViewType } from './keybindings';

export type CommandHandler = () => void;

export interface Command {
  /** Unique dotted key, e.g. "global.saveProject", "canvas.toolPencil" */
  key: string;
  /** View this command belongs to, or 'global' */
  view: ViewType | 'global';
  /** Handler to execute */
  handler: CommandHandler;
  /** Optional icon for palette display */
  icon?: IconType;
  /** Optional: return false to grey-out in the palette */
  enabled?: () => boolean;
}

export type CommandProvider = () => Command[];

// --- Singleton registry ---

const commands = new Map<string, Command>();
const providers: CommandProvider[] = [];
let changeGeneration = 0;

export function registerCommand(cmd: Command): void {
  commands.set(cmd.key, cmd);
  changeGeneration++;
}

export function unregisterCommand(key: string): void {
  commands.delete(key);
  changeGeneration++;
}

export function registerCommandProvider(provider: CommandProvider): () => void {
  providers.push(provider);
  changeGeneration++;
  return () => {
    const idx = providers.indexOf(provider);
    if (idx >= 0) providers.splice(idx, 1);
    changeGeneration++;
  };
}

/** Returns all static commands + commands from all providers. */
export function getAllCommands(): Command[] {
  const result = [...commands.values()];
  for (const provider of providers) {
    result.push(...provider());
  }
  return result;
}

export function getCommand(key: string): Command | undefined {
  return commands.get(key);
}

export function executeCommand(key: string): boolean {
  const cmd = commands.get(key);
  if (!cmd) return false;
  if (cmd.enabled && !cmd.enabled()) return false;
  cmd.handler();
  return true;
}

/** Monotonically increasing counter that bumps on any registry change. */
export function getChangeGeneration(): number {
  return changeGeneration;
}
