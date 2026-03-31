import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useSettingsStore } from '../store/settingsStore';
import { getAllCommands, Command } from '../config/commandRegistry';
import { ViewType } from '../config/keybindings';

/**
 * Parses a keybinding string like "ctrl+shift+b" into a normalized form
 * that can be compared against a KeyboardEvent.
 */
function parseBinding(binding: string): { ctrl: boolean; shift: boolean; alt: boolean; key: string } | null {
  if (!binding) return null;
  const parts = binding.toLowerCase().split('+');
  const ctrl = parts.includes('ctrl') || parts.includes('meta');
  const shift = parts.includes('shift');
  const alt = parts.includes('alt');
  const key = parts.filter((p) => !['ctrl', 'meta', 'shift', 'alt'].includes(p)).join('+');
  if (!key) return null;
  return { ctrl, shift, alt, key };
}

function normalizeEventKey(e: KeyboardEvent): string {
  let key = e.key.toLowerCase();
  if (key === ' ') key = 'space';
  if (key === 'arrowup') key = 'up';
  if (key === 'arrowdown') key = 'down';
  if (key === 'arrowleft') key = 'left';
  if (key === 'arrowright') key = 'right';
  // Map = when shift is held (some keyboards produce '+')
  if (key === '+' && e.code === 'Equal') key = '=';
  return key;
}

function eventMatchesBinding(e: KeyboardEvent, binding: ReturnType<typeof parseBinding>): boolean {
  if (!binding) return false;
  const ctrl = e.ctrlKey || e.metaKey;
  const shift = e.shiftKey;
  const alt = e.altKey;

  if (ctrl !== binding.ctrl) return false;
  if (shift !== binding.shift) return false;
  if (alt !== binding.alt) return false;

  return normalizeEventKey(e) === binding.key;
}

/**
 * Resolves the keybinding for a command from the settings store.
 * Convention: setting ID = `editor.keybindings.${command.key}`
 */
function resolveKeybinding(commandKey: string, settingsValues: Record<string, unknown>): string | undefined {
  const settingId = `editor.keybindings.${commandKey}`;
  const val = settingsValues[settingId];
  return typeof val === 'string' && val ? val : undefined;
}

interface BindingEntry {
  parsed: ReturnType<typeof parseBinding>;
  command: Command;
}

/**
 * Central hotkey hook — reads all registered commands, resolves their
 * keybindings from settings, and listens for keyboard events.
 * View-scoped commands only fire when their view is focused.
 * Global commands always fire.
 *
 * Call once in App.tsx.
 */
export function useCommandHotkeys() {
  const focusedView = useEditorStore((s) => s.focusedView);
  const settingsValues = useSettingsStore((s) => s.values);

  // Keep a ref with the latest bindings so the event handler is always current
  const bindingsRef = useRef<BindingEntry[]>([]);
  const focusedViewRef = useRef<ViewType | null>(null);
  focusedViewRef.current = focusedView;

  // Rebuild binding list whenever commands or settings change
  useEffect(() => {
    const commands = getAllCommands();
    const entries: BindingEntry[] = [];

    for (const cmd of commands) {
      const kb = resolveKeybinding(cmd.key, settingsValues);
      if (!kb) continue;
      const parsed = parseBinding(kb);
      if (!parsed) continue;
      entries.push({ parsed, command: cmd });
    }

    bindingsRef.current = entries;
  }, [settingsValues]);

  // Single keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const currentView = focusedViewRef.current;

      for (const { parsed, command } of bindingsRef.current) {
        if (!eventMatchesBinding(e, parsed)) continue;

        // Check view scoping
        if (command.view !== 'global') {
          if (currentView !== command.view) {
            // Allow timeline commands when preview is focused
            if (!(command.view === 'timeline' && currentView === 'preview')) continue;
          }
        }

        // Check enabled
        if (command.enabled && !command.enabled()) continue;

        e.preventDefault();
        e.stopPropagation();
        command.handler();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);
}
