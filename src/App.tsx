import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar/TopBar';
import { LayoutRoot } from './components/Layout/LayoutRoot';

import { NewProjectModal } from './components/NewProjectModal';
import { ResizeCanvasModal } from './components/Modals/ResizeCanvasModal';
import { ExportModal } from './components/Modals/ExportModal';
import { SaveLayoutModal } from './components/Modals/SaveLayoutModal';
import { LayoutManagerModal } from './components/Modals/LayoutManagerModal';
import { useProjectStore } from './store/projectStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTranslation } from 'react-i18next';

import { saveCurrentProject, loadProjectFromDisk } from './services/projectActions';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { IconRegistry } from './components/IconRegistry';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SettingsPage } from './components/Settings/SettingsPage';
import { useSettingsStore } from './store/settingsStore';
import { useKeybindingsFromSettings } from './hooks/useKeybindingsFromSettings';
import { useGlobalCommands } from './hooks/useGlobalCommands';
import { useProjectCommands } from './hooks/useProjectCommands';
import { useCommandHotkeys } from './hooks/useCommandHotkeys';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { LoadingOverlay } from './components/LoadingOverlay';
import { StatusIndicator } from './components/StatusIndicator';
import { useLoadingStore } from './store/loadingStore';
import { GitHistoryPage } from './components/GitHistory/GitHistoryPage';
import { StartTaskModal } from './components/StartTaskModal';
import { ConflictResolver } from './components/ConflictResolver';
import { useTaskStore } from './store/taskStore';
import { WikiPage } from './components/Wiki/WikiPage';

function App() {
  const { t } = useTranslation();
  const project = useProjectStore((state) => state.project);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [showResizeCanvas, setShowResizeCanvas] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveLayout, setShowSaveLayout] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showWiki, setShowWiki] = useState(false);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);

  const loadRecentProjects = () => {
    try {
      const stored = localStorage.getItem('recentProjects');
      if (stored) {
        setRecentProjects(JSON.parse(stored));
      }
    } catch (_e) {
      console.error('Failed to parse recent projects');
    }
  };

  useEffect(() => {
    loadRecentProjects();
  }, [project]); // Reload when project changes (like saving)

  const handleLoadProject = async () => {
    try {
      const path = await openDialog({ directory: true });
      if (!path) return;
      await loadProjectFromDisk(path as string);
      loadRecentProjects();
    } catch (error) {
      console.error('Failed to load project:', error);
      alert(t('error.load_failed', 'Failed to load project'));
    }
  };

  const handleLoadRecentProject = async (path: string) => {
    try {
      await loadProjectFromDisk(path);
      loadRecentProjects();
    } catch (error) {
      console.error('Failed to load recent project:', error);
      alert(t('error.load_failed_path', 'Failed to load project from {path}', { path }));
    }
  };

  // Register global commands
  const toggleCommandPalette = useCallback(() => setShowCommandPalette((v) => !v), []);
  useGlobalCommands({
    onNewProject: () => setShowNewProjectModal(true),
    onOpen: handleLoadProject,
    onOpenCommandPalette: toggleCommandPalette,
    onSave: saveCurrentProject,
    onSaveWithoutTask: () => saveCurrentProject({ skipTaskCheck: true }),
    onSaveLayout: () => setShowSaveLayout(true),
    onManageLayouts: () => setShowLayoutManager(true),
    onOpenWiki: () => setShowWiki(true),
  });

  // Register dynamic project commands (open spritesheet/animation)
  useProjectCommands();

  // Central hotkey listener driven by command registry + settings
  useCommandHotkeys();

  // Sync keybinding settings → editorStore (for legacy consumers)
  useKeybindingsFromSettings();

  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  const isLoading = useLoadingStore((s) => s.isLoading);
  const loadingMessage = useLoadingStore((s) => s.message);
  const loadingMode = useLoadingStore((s) => s.mode);
  const showStartTaskPrompt = useTaskStore((s) => s.showStartTaskPrompt);
  const dismissStartTaskPrompt = useTaskStore((s) => s.dismissStartTaskPrompt);
  const conflict = useTaskStore((s) => s.conflict);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-900 text-slate-200 overflow-hidden">
      <ToastContainer theme="dark" position="bottom-right" />

      {isLoading && loadingMode === 'overlay' && <LoadingOverlay message={loadingMessage} />}
      {isLoading && loadingMode === 'status' && <StatusIndicator message={loadingMessage} />}
      {isSettingsOpen && <SettingsPage />}
      {showWiki && <WikiPage onClose={() => setShowWiki(false)} />}
      {conflict && <ConflictResolver />}
      {showTaskHistory && <GitHistoryPage onClose={() => setShowTaskHistory(false)} />}
      {showCommandPalette && <CommandPalette onClose={() => setShowCommandPalette(false)} />}
      {showStartTaskPrompt && (
        <StartTaskModal
          onClose={dismissStartTaskPrompt}
          onSkip={() => {
            dismissStartTaskPrompt();
            saveCurrentProject({ skipTaskCheck: true });
          }}
        />
      )}

      <TopBar
        onRequestNewProject={() => setShowNewProjectModal(true)}
        onRequestTaskHistory={() => setShowTaskHistory(true)}
        onRequestResizeCanvas={() => setShowResizeCanvas(true)}
        onRequestExport={() => setShowExportModal(true)}
      />

      {showNewProjectModal && <NewProjectModal onClose={() => setShowNewProjectModal(false)} />}

      {showResizeCanvas &&
        useProjectStore.getState().activeSpritesheetId &&
        useProjectStore.getState().activeItemId &&
        useProjectStore.getState().activeItemType === 'animation' && (
          <ResizeCanvasModal
            spritesheetId={useProjectStore.getState().activeSpritesheetId!}
            animationId={useProjectStore.getState().activeItemId!}
            onClose={() => setShowResizeCanvas(false)}
          />
        )}

      {showExportModal && project && <ExportModal onClose={() => setShowExportModal(false)} />}

      {showSaveLayout && <SaveLayoutModal onClose={() => setShowSaveLayout(false)} />}
      {showLayoutManager && <LayoutManagerModal onClose={() => setShowLayoutManager(false)} />}

      {project ? (
        <ErrorBoundary>
          <LayoutRoot />
        </ErrorBoundary>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-slate-800">
          <div className="text-center text-slate-500 border border-slate-700 bg-slate-900 p-8 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="mb-4 text-3xl font-bold text-slate-300">{t('no_project.title', 'No Project Open')}</h2>
            <p className="text-sm mb-8 text-slate-400">
              {t('no_project.description', 'Create a new project or load an existing one.')}
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow-md transition-all w-full flex items-center justify-center gap-2"
              >
                <IconRegistry.Folder className="w-5 h-5" />
                {t('no_project.create_button', 'Create New Project')}
              </button>

              <button
                onClick={handleLoadProject}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium shadow-md transition-all w-full flex items-center justify-center gap-2"
              >
                <IconRegistry.FolderOpen className="w-5 h-5" />
                {t('no_project.load_button', 'Load Project')}
              </button>
            </div>

            {recentProjects.length > 0 && (
              <div className="mt-8 text-left">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {t('no_project.recent', 'Recent Projects')}
                </h3>
                <div className="space-y-2">
                  {recentProjects.slice(0, 5).map((recentPath: string, index: number) => {
                    // Extract project name from path for display
                    const parts = recentPath.split(/[/]/);
                    const name = parts[parts.length - 1];
                    const dir = parts.slice(0, -1).join('/');

                    return (
                      <button
                        key={index}
                        onClick={() => handleLoadRecentProject(recentPath)}
                        className="w-full text-left p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 transition-colors group flex items-center justify-between"
                      >
                        <div className="truncate pr-4">
                          <div className="text-slate-300 font-medium truncate group-hover:text-indigo-400">{name}</div>
                          <div className="text-xs text-slate-500 truncate" title={dir}>
                            {dir}
                          </div>
                        </div>
                        <IconRegistry.FolderOpen className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
