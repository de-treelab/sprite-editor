import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerCommand,
  unregisterCommand,
  getCommand,
  getAllCommands,
  executeCommand,
  registerCommandProvider,
  getChangeGeneration,
} from '../../config/commandRegistry';

describe('commandRegistry', () => {
  const testKey = '__test.command__';
  const testKey2 = '__test.command2__';

  beforeEach(() => {
    unregisterCommand(testKey);
    unregisterCommand(testKey2);
  });

  it('registers and retrieves a command', () => {
    const handler = vi.fn();
    registerCommand({ key: testKey, view: 'global', handler });
    expect(getCommand(testKey)).toBeDefined();
    expect(getCommand(testKey)!.key).toBe(testKey);
  });

  it('unregisters a command', () => {
    registerCommand({ key: testKey, view: 'global', handler: vi.fn() });
    unregisterCommand(testKey);
    expect(getCommand(testKey)).toBeUndefined();
  });

  it('executeCommand calls handler and returns true', () => {
    const handler = vi.fn();
    registerCommand({ key: testKey, view: 'global', handler });
    const result = executeCommand(testKey);
    expect(result).toBe(true);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('executeCommand returns false for unknown command', () => {
    expect(executeCommand('nonexistent.cmd')).toBe(false);
  });

  it('executeCommand respects enabled predicate', () => {
    const handler = vi.fn();
    registerCommand({
      key: testKey,
      view: 'global',
      handler,
      enabled: () => false,
    });
    const result = executeCommand(testKey);
    expect(result).toBe(false);
    expect(handler).not.toHaveBeenCalled();
  });

  it('getAllCommands includes static commands', () => {
    registerCommand({ key: testKey, view: 'global', handler: vi.fn() });
    const all = getAllCommands();
    expect(all.some((c) => c.key === testKey)).toBe(true);
  });

  it('getAllCommands includes provider commands', () => {
    const unsub = registerCommandProvider(() => [{ key: testKey2, view: 'global', handler: vi.fn() }]);
    const all = getAllCommands();
    expect(all.some((c) => c.key === testKey2)).toBe(true);
    unsub();
  });

  it('provider unsubscribe removes provider', () => {
    const unsub = registerCommandProvider(() => [{ key: testKey2, view: 'global', handler: vi.fn() }]);
    unsub();
    const all = getAllCommands();
    expect(all.some((c) => c.key === testKey2)).toBe(false);
  });

  it('getChangeGeneration increments on changes', () => {
    const gen1 = getChangeGeneration();
    registerCommand({ key: testKey, view: 'global', handler: vi.fn() });
    const gen2 = getChangeGeneration();
    expect(gen2).toBeGreaterThan(gen1);
  });
});
