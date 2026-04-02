import React from 'react';
import { useTaskStore } from '../store/taskStore';
import { IconRegistry } from './IconRegistry';
import { Button } from './ui';
import { useTranslation } from 'react-i18next';

export const ConflictResolver: React.FC = () => {
  const conflict = useTaskStore((s) => s.conflict);
  const activeTask = useTaskStore((s) => s.activeTask);
  const resolveConflict = useTaskStore((s) => s.resolveConflict);
  const resolveAllConflicts = useTaskStore((s) => s.resolveAllConflicts);
  const continueRebase = useTaskStore((s) => s.continueRebase);
  const abortConflictResolution = useTaskStore((s) => s.abortConflictResolution);

  if (!conflict) return null;

  const { t } = useTranslation();
  const allResolved = conflict.files.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <IconRegistry.Alert className="text-amber-400 w-5 h-5" />
          <h1 className="text-lg font-semibold text-slate-200">{t('conflict.title')}</h1>
          {activeTask && (
            <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{activeTask.name}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={abortConflictResolution}>
          {t('common.abort')}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-sm text-slate-400 mb-4">{t('conflict.description')}</p>

        {/* Bulk actions */}
        {!allResolved && (
          <div className="flex gap-2 mb-4">
            <Button variant="secondary" size="sm" onClick={() => resolveAllConflicts('ours')}>
              {t('conflict.keep_all_mine')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => resolveAllConflicts('theirs')}>
              {t('conflict.keep_all_theirs')}
            </Button>
          </div>
        )}

        {allResolved ? (
          <div className="text-center py-12">
            <IconRegistry.GitCommit className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-slate-300 mb-1">{t('conflict.all_resolved')}</p>
            <p className="text-sm text-slate-500 mb-6">{t('conflict.click_continue')}</p>
            <Button variant="primary" onClick={continueRebase}>
              {t('common.continue')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conflict.files.map((file) => (
              <div
                key={file}
                className="flex items-center justify-between px-4 py-3 bg-slate-800 border border-slate-700 rounded"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IconRegistry.File className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 font-mono truncate">{file}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <Button variant="secondary" size="sm" onClick={() => resolveConflict(file, 'ours')}>
                    {t('conflict.keep_mine')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => resolveConflict(file, 'theirs')}>
                    {t('conflict.keep_theirs')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
