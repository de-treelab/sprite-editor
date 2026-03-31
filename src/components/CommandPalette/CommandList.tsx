import React from 'react';
import { Command } from '../../config/commandRegistry';
import { formatKeybinding } from './commandUtils';

export interface ScoredCommand {
  cmd: Command;
  displayName: string;
  viewLabel: string;
  score: number;
}

interface CommandListProps {
  commands: ScoredCommand[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onExecute: () => void;
  getKeybinding: (cmdKey: string) => string | undefined;
  listRef: React.RefObject<HTMLDivElement>;
}

export const CommandList: React.FC<CommandListProps> = ({
  commands,
  selectedIndex,
  onSelectIndex,
  onExecute,
  getKeybinding,
  listRef,
}) => (
  <div ref={listRef} className="max-h-[40vh] overflow-y-auto py-1">
    {commands.length === 0 ? (
      <div className="px-4 py-6 text-center text-sm text-slate-500">No matching commands</div>
    ) : (
      commands.map((entry, idx) => {
        const kb = getKeybinding(entry.cmd.key);
        const disabled = entry.cmd.enabled ? !entry.cmd.enabled() : false;
        const Icon = entry.cmd.icon;

        return (
          <button
            key={entry.cmd.key}
            className={`
              w-full text-left px-4 py-2 flex items-center gap-3 text-sm transition-colors
              ${idx === selectedIndex ? 'bg-indigo-600/30 text-white' : 'text-slate-300 hover:bg-slate-700/50'}
              ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
            `}
            onMouseEnter={() => onSelectIndex(idx)}
            onClick={() => {
              if (!disabled) onExecute();
            }}
          >
            <span className="w-5 h-5 flex items-center justify-center text-slate-400 flex-shrink-0">
              {Icon && <Icon className="w-4 h-4" />}
            </span>

            <span className="flex-1 truncate">
              {entry.displayName}
            </span>

            <span className="text-[10px] text-slate-500 bg-slate-700/60 px-1.5 py-0.5 rounded flex-shrink-0">
              {entry.viewLabel}
            </span>

            {kb && (
              <kbd className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-600 flex-shrink-0 font-mono">
                {formatKeybinding(kb)}
              </kbd>
            )}
          </button>
        );
      })
    )}
  </div>
);
