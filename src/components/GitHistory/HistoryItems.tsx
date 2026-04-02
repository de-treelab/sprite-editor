import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitLogEntry, TaskGroup } from './gitLogUtils';

interface CommitRowProps {
  entry: GitLogEntry;
  showClean?: boolean;
  onPreview?: (entry: GitLogEntry) => void;
  onRestore?: (entry: GitLogEntry) => void;
}

export const CommitRow: React.FC<CommitRowProps> = ({ entry, showClean = false, onPreview, onRestore }) => {
  const { t } = useTranslation();
  return (
    <div className="relative flex items-start gap-4 py-2 pl-8 group">
      <div className="absolute left-[7px] top-[12px] w-[9px] h-[9px] rounded-full border-2 border-slate-600 bg-slate-800 group-hover:border-indigo-500 transition-colors" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{showClean ? entry.cleanMessage : entry.message}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs font-mono text-indigo-400/80">{entry.hash}</span>
          <span className="text-xs text-slate-500">{entry.relativeDate}</span>
          <span className="text-xs text-slate-600">{entry.author}</span>
          <div className="hidden group-hover:flex items-center gap-1 ml-auto">
            {onPreview && (
              <button
                className="text-xs text-slate-400 hover:text-indigo-400 px-2 py-0.5 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(entry);
                }}
                title={t('git_history.preview_tooltip')}
              >
                {t('common.preview')}
              </button>
            )}
            {onRestore && (
              <button
                className="text-xs text-slate-400 hover:text-orange-400 px-2 py-0.5 rounded bg-slate-700/50 hover:bg-slate-700 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore(entry);
                }}
                title={t('git_history.restore_tooltip')}
              >
                {t('common.restore')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface TaskGroupRowProps {
  group: TaskGroup;
  onPreview?: (entry: GitLogEntry) => void;
  onRestore?: (entry: GitLogEntry) => void;
}

export const TaskGroupRow: React.FC<TaskGroupRowProps> = ({ group, onPreview, onRestore }) => {
  const [expanded, setExpanded] = useState(false);
  const first = group.entries[0];
  const last = group.entries[group.entries.length - 1];

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative flex items-start gap-4 py-2 pl-8 group w-full text-left hover:bg-slate-800/50 rounded transition-colors"
      >
        <div className="absolute left-[5px] top-[10px] w-[13px] h-[13px] rounded-full border-2 border-indigo-500 bg-indigo-500/20 group-hover:bg-indigo-500/40 transition-colors" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-1.5 py-0.5 rounded">
              {group.taskId}
            </span>
            <span className="text-sm text-slate-200 truncate">
              {group.entries.length} commit{group.entries.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-500 ml-auto flex-shrink-0">{expanded ? '▾' : '▸'}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-slate-500">{first.relativeDate}</span>
            {group.entries.length > 1 && <span className="text-xs text-slate-600">— {last.relativeDate}</span>}
            <span className="text-xs text-slate-600">{first.author}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="ml-4 border-l border-indigo-500/20 pl-2">
          {group.entries.map((entry, i) => (
            <CommitRow key={entry.hash + i} entry={entry} showClean onPreview={onPreview} onRestore={onRestore} />
          ))}
        </div>
      )}
    </div>
  );
};
