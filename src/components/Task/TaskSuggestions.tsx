import React from 'react';
import { TaskInfo } from '../../store/taskStore';

interface TaskSuggestionsProps {
  suggestedTasks: TaskInfo[];
  hasSimilarMatches: boolean;
  onAmend: (task: TaskInfo) => void;
}

export const TaskSuggestions: React.FC<TaskSuggestionsProps> = ({
  suggestedTasks,
  hasSimilarMatches,
  onAmend,
}) => {
  if (suggestedTasks.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {hasSimilarMatches ? 'Similar existing tasks — click to amend' : 'Recent tasks — click to amend'}
      </h3>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {suggestedTasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onAmend(task)}
            className="w-full text-left px-3 py-2 rounded bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-indigo-500/50 transition-colors flex items-center justify-between group"
          >
            <div className="min-w-0">
              <div className="text-sm text-slate-300 truncate group-hover:text-indigo-400">
                <span className="text-xs text-slate-500 font-mono mr-1.5">{task.id}</span>
                {task.name}
              </div>
              <div className="text-xs text-slate-500">
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
            <span className="text-xs text-slate-500 group-hover:text-indigo-400 flex-shrink-0 ml-2">
              Amend
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
