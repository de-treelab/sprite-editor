import { useProjectStore } from '../store/projectStore';
import { useLoadingStore } from '../store/loadingStore';
import { useSettingsStore } from '../store/settingsStore';
import { saveProjectV2, gitCommit, gitPush, gitHasRemote, loadProjectV2, gitPull, gitIsRepo, gitInit, gitRemoteSetUrl, gitCurrentBranch } from './backend';
import { buildCommitMessage, buildSaveManifest } from '../store/changeTracker';
import { toast } from 'react-toastify';
import i18n from '../i18n';
import { useTaskStore } from '../store/taskStore';

function isGitEnabled(): boolean {
  return useSettingsStore.getState().getValue<boolean>('git.enabled');
}

/**
 * Resolve the on-disk path for the current project.
 * Prefers the store's projectPath, falls back to localStorage heuristic.
 */
export function resolveProjectPath(): string | null {
  const { project, projectPath } = useProjectStore.getState();
  if (projectPath) return projectPath;
  if (!project) return null;

  // Legacy fallback: search recentProjects in localStorage
  try {
    const recents: string[] = JSON.parse(localStorage.getItem('recentProjects') || '[]');
    const match = recents.find(
      (p: string) => p.endsWith(`/${project.name}`) || p.endsWith(`\\${project.name}`),
    );
    if (match) return match;
  } catch { /* ignore */ }
  return null;
}

/**
 * Save the current project to disk using v2 multi-file format,
 * auto-commit with a descriptive message, and push if remote exists.
 */
export async function saveCurrentProject(): Promise<void> {
  const { project, changeTracker, resetChangeTracker } = useProjectStore.getState();
  if (!project) return;

  // If git is enabled and we're on the main branch, prompt user to start a task first
  if (isGitEnabled()) {
    const savePath = resolveProjectPath();
    if (savePath) {
      try {
        const branch = await gitCurrentBranch(savePath);
        const mainBranch = useSettingsStore.getState().getValue<string>('git.mainBranch') || 'main';
        if (branch === mainBranch || branch === 'master') {
          useTaskStore.getState().requestStartTaskPrompt();
          return;
        }
      } catch {
        // git not available — continue with normal save
      }
    }
  }

  const t = i18n.t.bind(i18n);
  const { setLoading } = useLoadingStore.getState();

  setLoading(true, t('loading.saving', 'Saving project…'), 'status');
  try {
    const savePath = resolveProjectPath();
    if (!savePath) {
      toast.error(t('topbar.file.save_failed', 'Failed to save project.') + '\nNo project path found.');
      return;
    }

    // Build manifest from change tracker and save via v2
    const manifestJson = buildSaveManifest(project, changeTracker);
    await saveProjectV2(savePath, manifestJson);

    if (isGitEnabled()) {
      // Build descriptive commit message, prefixed with task ID if active
      let message = buildCommitMessage(changeTracker, project);
      const activeTask = useTaskStore.getState().activeTask;
      if (activeTask) {
        message = `[task:${activeTask.id}] ${message}`;
      }
      try {
        await gitCommit(savePath, message);
      } catch {
        // Not a git repo or nothing to commit — that's fine
      }

      // Push in background if remote exists
      try {
        const hasRemote = await gitHasRemote(savePath);
        if (hasRemote) {
          gitPush(savePath).catch((e) => {
            console.warn('Git push failed:', e);
            toast.warn('Changes saved locally. Push failed — will retry next save.');
          });
        }
      } catch {
        // git not available or not a repo
      }
    }

    // Clear change tracker
    resetChangeTracker();

    toast.success(t('topbar.file.save_success', 'Project saved successfully!'));
  } catch (e) {
    console.error(e);
    toast.error(t('topbar.file.save_failed', 'Failed to save project.') + '\n' + e);
  } finally {
    setLoading(false);
  }
}

/**
 * Load a project from disk using v2 multi-file format.
 * Pulls latest from remote first if available.
 */
export async function loadProjectFromDisk(dir: string): Promise<void> {
  const { setProject, setProjectPath, setActiveSpritesheet, setActiveAnimation, setActiveFrame, setActiveLayer } = useProjectStore.getState();
  const { setLoading } = useLoadingStore.getState();

  setLoading(true, i18n.t('loading.opening', 'Opening project…'));
  try {
    if (isGitEnabled()) {
      // Auto-initialize git if enabled but project is not yet a repo
      try {
        const repo = await gitIsRepo(dir);
        if (!repo) {
          await gitInit(dir);
          const defaultRemote = useSettingsStore.getState().getValue<string>('git.remote');
          if (defaultRemote) {
            await gitRemoteSetUrl(dir, defaultRemote);
          }
          await gitCommit(dir, 'Initial commit');
        }
      } catch {
        // git not available — continue without
      }

      // Try to pull latest if remote is configured
      try {
        const hasRemote = await gitHasRemote(dir);
        if (hasRemote) {
          try {
            await gitPull(dir);
          } catch (e) {
            console.warn('Git pull failed, loading local state:', e);
            toast.warn("Remote changes couldn't be merged automatically. Loading local state.");
          }
        }
      } catch {
        // Not a git repo
      }
    }

    const data = await loadProjectV2(dir);
    const parsed = JSON.parse(data);
    setProject(parsed);
    setProjectPath(dir);

    if (parsed.spritesheets && parsed.spritesheets.length > 0) {
      const firstSheet = parsed.spritesheets[0];
      setActiveSpritesheet(firstSheet.id);
      if (firstSheet.animations && firstSheet.animations.length > 0) {
        setActiveAnimation(firstSheet.animations[0].id);
      }
      if (firstSheet.frames && firstSheet.frames.length > 0) {
        setActiveFrame(firstSheet.frames[0].id);
        if (firstSheet.frames[0].layers && firstSheet.frames[0].layers.length > 0) {
          setActiveLayer(firstSheet.frames[0].layers[0].id);
        }
      }
    }

    // Update recent projects
    try {
      const recents = JSON.parse(localStorage.getItem('recentProjects') || '[]');
      const updated = [dir, ...recents.filter((p: string) => p !== dir)].slice(0, 5);
      localStorage.setItem('recentProjects', JSON.stringify(updated));
    } catch { /* ignore */ }

    // Sync task state from git
    if (isGitEnabled()) {
      useTaskStore.getState().syncFromGit().catch(() => {});
    }
  } finally {
    setLoading(false);
  }
}
