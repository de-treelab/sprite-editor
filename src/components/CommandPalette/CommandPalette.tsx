import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { getAllCommands } from '../../config/commandRegistry';
import { useSettingsStore } from '../../store/settingsStore';
import { useEditorStore } from '../../store/editorStore';
import { useTranslation } from 'react-i18next';
import { ViewType, viewDisplayNames } from '../../config/keybindings';
import { commandDisplayName } from './commandUtils';
import { CommandList, ScoredCommand } from './CommandList';

interface CommandPaletteProps {
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const settingsValues = useSettingsStore((s) => s.values);
  const focusedView = useEditorStore((s) => s.focusedView);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Gather all commands
  const allCommands = useMemo(() => getAllCommands(), []);

  // Resolve keybinding from settings
  const getKeybinding = useCallback(
    (cmdKey: string): string | undefined => {
      const val = settingsValues[`editor.keybindings.${cmdKey}`];
      return typeof val === 'string' && val ? val : undefined;
    },
    [settingsValues],
  );

  // Filter and score
  const filteredCommands = useMemo(() => {
    const q = query.toLowerCase().trim();

    const scored: ScoredCommand[] = [];

    for (const cmd of allCommands) {
      const displayName = cmd.displayName || commandDisplayName(cmd.key, t);
      const viewLabel = cmd.view === 'global' ? t('common.global') : (viewDisplayNames[cmd.view as ViewType] ?? cmd.view);
      const searchText = `${displayName} ${cmd.key} ${viewLabel}`.toLowerCase();

      if (q && !searchText.includes(q)) continue;

      // Score: exact match > starts with > includes
      let score = 0;
      if (cmd.view === 'global') score += 100;
      else if (cmd.view === focusedView) score += 80;
      if (q) {
        if (displayName.toLowerCase() === q) score += 50;
        else if (displayName.toLowerCase().startsWith(q)) score += 30;
        else if (cmd.key.toLowerCase().includes(q)) score += 10;
      }

      scored.push({ cmd, displayName, viewLabel, score });
    }

    scored.sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
    return scored;
  }, [allCommands, query, focusedView, t]);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector(`[data-cmd-index="${selectedIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeSelected = useCallback(() => {
    const entry = filteredCommands[selectedIndex];
    if (!entry) return;
    if (entry.cmd.enabled && !entry.cmd.enabled()) return;
    onClose();
    // Execute after closing so UI updates cleanly
    requestAnimationFrame(() => entry.cmd.handler());
  }, [filteredCommands, selectedIndex, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          executeSelected();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands.length, executeSelected, onClose],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="px-4 py-3 border-b border-slate-700">
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500"
            placeholder={t('command_palette.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Command list */}
        <CommandList
          commands={filteredCommands}
          selectedIndex={selectedIndex}
          onSelectIndex={setSelectedIndex}
          onExecute={executeSelected}
          getKeybinding={getKeybinding}
          listRef={listRef as React.RefObject<HTMLDivElement>}
        />
      </div>
    </div>
  );
};
