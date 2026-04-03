import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { resolveProjectPath, loadProjectFromDisk } from '../../services/projectActions';
import { gitLog, gitIsRepo, gitRemoteGetUrl, gitRestoreToCommit } from '../../services/backend';
import { IconRegistry } from '../IconRegistry';
import { GitLogEntry, parseLogLine, buildHistoryItems } from './gitLogUtils';
import { CommitRow, TaskGroupRow } from './HistoryItems';
import { VersionPreviewModal } from './VersionPreviewModal';
import { Modal, ModalFooter } from '../ui';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export const GitHistoryPage: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const [entries, setEntries] = useState<GitLogEntry[]>([]);
  const [isRepo, setIsRepo] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<GitLogEntry | null>(null);
  const [restoreEntry, setRestoreEntry] = useState<GitLogEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const refresh = useCallback(async () => {
    const path = resolveProjectPath();
    if (!path) {
      setLoading(false);
      setError(t('git_history.no_project_path'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const repo = await gitIsRepo(path);
      setIsRepo(repo);
      if (!repo) {
        setLoading(false);
        return;
      }

      const [logLines, remote] = await Promise.all([gitLog(path), gitRemoteGetUrl(path).catch(() => '')]);

      setRemoteUrl(remote);
      setEntries(logLines.map(parseLogLine).filter(Boolean) as GitLogEntry[]);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // When filtering by a specific task, show only those commits
  const filteredEntries = useMemo(() => {
    if (!filterTaskId) return entries;
    return entries.filter((e) => e.taskId === filterTaskId);
  }, [entries, filterTaskId]);

  const historyItems = useMemo(() => buildHistoryItems(filteredEntries), [filteredEntries]);

  // Collect all unique task IDs for the filter dropdown
  const allTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of entries) {
      if (e.taskId) ids.add(e.taskId);
    }
    return [...ids];
  }, [entries]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <IconRegistry.GitBranch className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold text-slate-200">{t('git_history.title')}</h1>
          {project && (
            <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{project.name}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Task filter */}
          {allTaskIds.length > 0 && (
            <select
              value={filterTaskId || ''}
              onChange={(e) => setFilterTaskId(e.target.value || null)}
              className="text-xs bg-slate-700 border border-slate-600 text-slate-300 rounded px-2 py-1 outline-none focus:border-indigo-500"
            >
              <option value="">{t('git_history.all_commits')}</option>
              {allTaskIds.map((id) => (
                <option key={id} value={id}>
                  Task {id}
                </option>
              ))}
            </select>
          )}
          <button
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
            onClick={refresh}
          >
            {t('common.refresh')}
          </button>
          <button
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700 transition-colors"
            onClick={onClose}
            title="Close"
          >
            <IconRegistry.Close className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Status bar */}
        {remoteUrl && (
          <div className="px-6 py-2 border-b border-slate-700/50 bg-slate-800/50">
            <span className="text-xs text-slate-500">{t('git_history.remote_label')}</span>
            <span className="text-xs text-slate-400 font-mono">{remoteUrl}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin mr-3" />
            {t('git_history.loading')}
          </div>
        )}

        {!loading && error && <div className="flex items-center justify-center h-64 text-red-400 text-sm">{error}</div>}

        {!loading && !isRepo && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm gap-2">
            <IconRegistry.GitBranch className="w-10 h-10 text-slate-600" />
            <p>{t('git_history.not_a_repo')}</p>
            <p className="text-xs text-slate-600">{t('git_history.not_a_repo_hint')}</p>
          </div>
        )}

        {!loading && isRepo && entries.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm gap-2">
            <IconRegistry.GitBranch className="w-10 h-10 text-slate-600" />
            <p>{t('git_history.no_commits')}</p>
            <p className="text-xs text-slate-600">{t('git_history.no_commits_hint')}</p>
          </div>
        )}

        {!loading && historyItems.length > 0 && (
          <div className="px-6 py-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-700" />

              <div className="space-y-1">
                {historyItems.map((item, i) =>
                  item.type === 'task' ? (
                    <TaskGroupRow
                      key={item.group.taskId + '-' + i}
                      group={item.group}
                      onPreview={setPreviewEntry}
                      onRestore={setRestoreEntry}
                    />
                  ) : (
                    <CommitRow
                      key={item.entry.hash + i}
                      entry={item.entry}
                      onPreview={setPreviewEntry}
                      onRestore={setRestoreEntry}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Version preview modal */}
      {previewEntry && (
        <VersionPreviewModal
          commitHash={previewEntry.hash}
          commitMessage={previewEntry.message}
          onClose={() => setPreviewEntry(null)}
        />
      )}

      {/* Restore confirmation modal */}
      {restoreEntry && (
        <Modal
          isOpen={true}
          onClose={() => setRestoreEntry(null)}
          title={t('git_history.restore_title')}
          footer={
            <ModalFooter
              onCancel={() => setRestoreEntry(null)}
              onConfirm={async () => {
                const path = resolveProjectPath();
                if (!path) return;
                setRestoring(true);
                try {
                  const msg = `Restore to version ${restoreEntry.hash}: ${restoreEntry.cleanMessage || restoreEntry.message}`;
                  await gitRestoreToCommit(path, restoreEntry.hash, msg);
                  await loadProjectFromDisk(path);
                  toast.success(`Restored to version ${restoreEntry.hash}`);
                  setRestoreEntry(null);
                  refresh();
                } catch (e) {
                  toast.error(`Restore failed: ${e}`);
                } finally {
                  setRestoring(false);
                }
              }}
              confirmText={restoring ? t('common.restoring') : t('common.restore')}
              confirmDisabled={restoring}
              confirmVariant="danger"
            />
          }
        >
          <p className="text-sm text-slate-300">
            {t('git_history.restore_body')} <span className="font-mono text-indigo-400">{restoreEntry.hash}</span> and
            create a new commit recording this change.
          </p>
          <p className="text-sm text-slate-200 mt-2 font-medium">
            "{restoreEntry.cleanMessage || restoreEntry.message}"
          </p>
          <p className="text-xs text-orange-400 mt-3">{t('git_history.restore_warning')}</p>
        </Modal>
      )}
    </div>
  );
};
