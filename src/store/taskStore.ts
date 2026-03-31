import { create } from 'zustand';
import { resolveProjectPath } from '../services/projectActions';
import { useSettingsStore } from './settingsStore';
import { useLoadingStore } from './loadingStore';
import { normalizeProjectName } from '../utils/string';
import {
  gitCurrentBranch,
  gitCheckoutNewBranch,
  gitCheckout,
  gitFetch,
  gitRebase,
  gitRebaseContinue,
  gitRebaseAbort,
  gitCommit,
  gitMergeBranch,
  gitDeleteBranch,
  gitConflictFiles,
  gitResolveOurs,
  gitResolveTheirs,
  gitHasRemote,
  gitPush,
  gitBranchExists,
  saveProjectV2,
  loadProjectV2,
} from '../services/backend';
import { useProjectStore } from './projectStore';
import { buildCommitMessage, buildSaveManifest } from './changeTracker';
import { toast } from 'react-toastify';
import i18n from '../i18n';

export interface TaskInfo {
  id: string;
  name: string;
  branch: string;
  createdAt: string;
  status: 'active' | 'finished';
}

export interface ConflictInfo {
  files: string[];
  taskBranch: string;
  mainBranch: string;
}

interface TaskState {
  activeTask: TaskInfo | null;
  recentTasks: TaskInfo[];
  conflict: ConflictInfo | null;
  showStartTaskPrompt: boolean;

  /** Sync state from git — call after opening/loading a project */
  syncFromGit: () => Promise<void>;
  /** Start a new task (creates branch). ID is user-provided. */
  startTask: (id: string, name: string) => Promise<void>;
  /** Resume/amend an existing finished task */
  amendTask: (task: TaskInfo) => Promise<void>;
  /** Finish current task (save, rebase on main, merge, delete branch) */
  finishTask: () => Promise<void>;
  /** Resolve a single conflict file */
  resolveConflict: (file: string, strategy: 'ours' | 'theirs') => Promise<void>;
  /** Resolve all remaining conflicts with one strategy */
  resolveAllConflicts: (strategy: 'ours' | 'theirs') => Promise<void>;
  /** Continue rebase after all conflicts resolved */
  continueRebase: () => Promise<void>;
  /** Abort the current conflict resolution */
  abortConflictResolution: () => Promise<void>;
  /** Clear active task (used on project close) */
  clearTask: () => void;
  /** Dismiss the start-task prompt */
  dismissStartTaskPrompt: () => void;
  /** Request to show the start-task prompt */
  requestStartTaskPrompt: () => void;
  /** Generate the next available task ID based on settings */
  generateNextTaskId: () => string;
}

function getMainBranch(): string {
  return useSettingsStore.getState().getValue<string>('git.mainBranch') || 'main';
}

function getAuthorSlug(): string {
  const author = useSettingsStore.getState().getValue<string>('git.authorName') || '';
  return author ? normalizeProjectName(author) : '';
}

function buildBranchName(taskId: string, taskName: string): string {
  const slug = normalizeProjectName(taskName).slice(0, 40);
  const idSlug = normalizeProjectName(taskId);
  const author = getAuthorSlug();
  if (author) {
    return `task/${author}/${idSlug}-${slug}`;
  }
  return `task/${idSlug}-${slug}`;
}

function parseTaskFromBranch(branch: string, recentTasks: TaskInfo[]): TaskInfo | null {
  // Try to find in recent tasks by branch name
  const found = recentTasks.find((t) => t.branch === branch);
  if (found) return { ...found, status: 'active' };

  // Parse branch name pattern: task/[author/]<id-slug>-<name-slug>
  const match = branch.match(/^task\/(?:.+\/)?(.+)$/);
  if (!match) return null;
  const rest = match[1];
  // The ID and name are both slugified; best-effort parse using first segment
  const dashIndex = rest.indexOf('-');
  if (dashIndex === -1) return null;
  return {
    id: rest.slice(0, dashIndex),
    name: rest.slice(dashIndex + 1).replace(/-/g, ' '),
    branch,
    createdAt: new Date().toISOString(),
    status: 'active',
  };
}

/** Generate the next task ID based on settings and existing tasks */
function generateNextId(recentTasks: TaskInfo[]): string {
  const settings = useSettingsStore.getState();
  const prefix = settings.getValue<string>('project.task.prefix') || 'TASK';
  const pattern = settings.getValue<string>('project.task.taskIdPattern') || '{{prefix}}-{{index}}';

  // Find the highest existing index across all known tasks for this prefix
  let maxIndex = 0;
  const indexRegex = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');
  for (const task of recentTasks) {
    const match = task.id.match(indexRegex);
    if (match) {
      maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
    }
  }

  const nextIndex = maxIndex + 1;
  return pattern
    .replace('{{prefix}}', prefix)
    .replace('{{index}}', String(nextIndex));
}

/** Load tasks metadata from project's .sprite-editor/tasks.json via localStorage (keyed by project path) */
function loadTasksMeta(projectPath: string): TaskInfo[] {
  try {
    const key = `tasks:${projectPath}`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveTasksMeta(projectPath: string, tasks: TaskInfo[]) {
  const key = `tasks:${projectPath}`;
  localStorage.setItem(key, JSON.stringify(tasks.slice(0, 50))); // keep last 50
}

export const useTaskStore = create<TaskState>((set, get) => ({
  activeTask: null,
  recentTasks: [],
  conflict: null,
  showStartTaskPrompt: false,

  syncFromGit: async () => {
    const path = resolveProjectPath();
    if (!path) {
      set({ activeTask: null, recentTasks: [] });
      return;
    }

    const recent = loadTasksMeta(path);
    set({ recentTasks: recent });

    try {
      const branch = await gitCurrentBranch(path);
      const main = getMainBranch();
      if (branch === main || branch === 'HEAD') {
        set({ activeTask: null });
      } else {
        const task = parseTaskFromBranch(branch, recent);
        set({ activeTask: task });
      }
    } catch {
      set({ activeTask: null });
    }
  },

  startTask: async (id: string, name: string) => {
    const path = resolveProjectPath();
    if (!path) throw new Error('No project path');

    const { setLoading } = useLoadingStore.getState();
    const t = i18n.t.bind(i18n);
    setLoading(true, t('loading.starting_task', 'Starting task…'), 'status');

    try {
      const main = getMainBranch();

      // Make sure we're on main first
      try { await gitCheckout(path, main); } catch { /* already on main or doesn't exist */ }

      // Pull latest main if remote exists
      try {
        const hasRemote = await gitHasRemote(path);
        if (hasRemote) {
          await gitFetch(path);
          try { await gitRebase(path, `origin/${main}`); } catch { /* no remote main yet */ }
        }
      } catch { /* no remote */ }

      // Create task
      const branch = buildBranchName(id, name);
      await gitCheckoutNewBranch(path, branch);

      const task: TaskInfo = {
        id,
        name,
        branch,
        createdAt: new Date().toISOString(),
        status: 'active',
      };

      // Save metadata
      const recent = get().recentTasks;
      const updated = [task, ...recent.filter((t) => t.id !== id)];
      saveTasksMeta(path, updated);

      set({ activeTask: task, recentTasks: updated });
      toast.success(t('task.started', 'Task started: {{name}}', { name }));
    } finally {
      setLoading(false);
    }
  },

  amendTask: async (task: TaskInfo) => {
    const path = resolveProjectPath();
    if (!path) throw new Error('No project path');

    const { setLoading } = useLoadingStore.getState();
    const t = i18n.t.bind(i18n);
    setLoading(true, t('loading.resuming_task', 'Resuming task…'), 'status');

    try {
      const main = getMainBranch();

      // Check if the branch still exists; if not, recreate it from current state
      const exists = await gitBranchExists(path, task.branch);
      if (!exists) {
        // Branch was deleted after finishing — recreate from current HEAD
        await gitCheckoutNewBranch(path, task.branch);
      } else {
        // Checkout the existing task branch
        await gitCheckout(path, task.branch);

        // Rebase on latest main
        try {
          const hasRemote = await gitHasRemote(path);
          if (hasRemote) {
            await gitFetch(path);
          }
        } catch { /* no remote */ }

        try {
          await gitRebase(path, main);
        } catch (e) {
          const err = String(e);
          if (err.startsWith('CONFLICT:')) {
            const files = await gitConflictFiles(path);
            set({ conflict: { files, taskBranch: task.branch, mainBranch: main } });
            toast.warn(t('task.conflicts_found', 'Conflicts found — please resolve them.'));
          } else {
            throw e;
          }
        }
      }

      // Update task status
      const amendedTask = { ...task, status: 'active' as const };
      const recent = get().recentTasks.map((t) => t.id === task.id ? amendedTask : t);
      saveTasksMeta(path, recent);

      set({ activeTask: amendedTask, recentTasks: recent });
      toast.success(t('task.resumed', 'Resumed task: {{name}}', { name: task.name }));
    } finally {
      setLoading(false);
    }
  },

  finishTask: async () => {
    const { activeTask } = get();
    if (!activeTask) return;

    const path = resolveProjectPath();
    if (!path) throw new Error('No project path');

    const { setLoading } = useLoadingStore.getState();
    const t = i18n.t.bind(i18n);
    setLoading(true, t('loading.finishing_task', 'Finishing task…'), 'status');

    try {
      const main = getMainBranch();

      // 1. Save and commit any remaining changes
      const { project, changeTracker, resetChangeTracker } = useProjectStore.getState();
      if (project) {
        const manifestJson = buildSaveManifest(project, changeTracker);
        await saveProjectV2(path, manifestJson);
        const message = `[task:${activeTask.id}] ${buildCommitMessage(changeTracker, project)}`;
        try { await gitCommit(path, message); } catch { /* nothing to commit */ }
        resetChangeTracker();
      }

      // 2. Fetch latest and rebase onto main
      try {
        const hasRemote = await gitHasRemote(path);
        if (hasRemote) {
          await gitFetch(path);
          // Update local main from remote
          try {
            await gitCheckout(path, main);
            await gitRebase(path, `origin/${main}`);
            await gitCheckout(path, activeTask.branch);
          } catch { /* continue */ }
        }
      } catch { /* no remote */ }

      try {
        await gitRebase(path, main);
      } catch (e) {
        const err = String(e);
        if (err.startsWith('CONFLICT:')) {
          const files = await gitConflictFiles(path);
          set({ conflict: { files, taskBranch: activeTask.branch, mainBranch: main } });
          toast.warn(t('task.conflicts_found', 'Conflicts found while finishing — please resolve them.'));
          return; // user resolves, then we continue
        }
        throw e;
      }

      // 3. Merge task into main
      await gitCheckout(path, main);
      await gitMergeBranch(path, activeTask.branch, `[task:${activeTask.id}] Merge ${activeTask.branch}`);

      // 4. Delete task branch
      try { await gitDeleteBranch(path, activeTask.branch); } catch { /* fine */ }

      // 5. Push if remote exists
      try {
        const hasRemote = await gitHasRemote(path);
        if (hasRemote) {
          gitPush(path).catch((e) => {
            console.warn('Push failed:', e);
            toast.warn('Task finished locally. Push failed — will retry next save.');
          });
        }
      } catch { /* no remote */ }

      // 6. Reload project from disk (main now has merged changes)
      const data = await loadProjectV2(path);
      const parsed = JSON.parse(data);
      useProjectStore.getState().setProject(parsed);

      // 7. Mark task as finished in metadata
      const recent = get().recentTasks.map((t) =>
        t.id === activeTask.id ? { ...t, status: 'finished' as const } : t,
      );
      saveTasksMeta(path, recent);

      set({ activeTask: null, recentTasks: recent, conflict: null });
      toast.success(t('task.finished', 'Task finished: {{name}}', { name: activeTask.name }));
    } finally {
      setLoading(false);
    }
  },

  resolveConflict: async (file: string, strategy: 'ours' | 'theirs') => {
    const path = resolveProjectPath();
    if (!path) return;

    if (strategy === 'ours') {
      await gitResolveOurs(path, file);
    } else {
      await gitResolveTheirs(path, file);
    }

    const { conflict } = get();
    if (conflict) {
      const remaining = conflict.files.filter((f) => f !== file);
      set({ conflict: { ...conflict, files: remaining } });
    }
  },

  resolveAllConflicts: async (strategy: 'ours' | 'theirs') => {
    const path = resolveProjectPath();
    if (!path) return;

    const { conflict } = get();
    if (!conflict) return;

    for (const file of conflict.files) {
      if (strategy === 'ours') {
        await gitResolveOurs(path, file);
      } else {
        await gitResolveTheirs(path, file);
      }
    }

    set({ conflict: { ...conflict, files: [] } });
  },

  continueRebase: async () => {
    const path = resolveProjectPath();
    if (!path) return;

    const { setLoading } = useLoadingStore.getState();
    setLoading(true, 'Continuing…', 'status');

    try {
      await gitRebaseContinue(path);
      set({ conflict: null });

      // If we were finishing a task, try the merge step again
      const { activeTask } = get();
      if (activeTask) {
        toast.success('Conflicts resolved. You can now finish the task.');
      }
    } catch (e) {
      // Might have more conflicts
      const files = await gitConflictFiles(path);
      if (files.length > 0) {
        const { conflict } = get();
        set({ conflict: { ...conflict!, files } });
        toast.warn('More conflicts found — please resolve them.');
      } else {
        toast.error('Rebase continue failed: ' + e);
      }
    } finally {
      setLoading(false);
    }
  },

  abortConflictResolution: async () => {
    const path = resolveProjectPath();
    if (!path) return;

    await gitRebaseAbort(path);
    set({ conflict: null });
    toast.info('Conflict resolution aborted.');
  },

  clearTask: () => set({ activeTask: null, recentTasks: [], conflict: null }),
  dismissStartTaskPrompt: () => set({ showStartTaskPrompt: false }),
  requestStartTaskPrompt: () => set({ showStartTaskPrompt: true }),
  generateNextTaskId: () => generateNextId(get().recentTasks),
}));
