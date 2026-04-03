import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { IconRegistry } from '../IconRegistry';
import { saveCurrentProject, loadProjectFromDisk } from '../../services/projectActions';
import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FocusIndicator } from '../ui';
import { useSettingsStore } from '../../store/settingsStore';
import { useTaskStore } from '../../store/taskStore';
import { FileMenu } from './FileMenu';
import { EditMenu } from './EditMenu';
import { TaskMenu } from './TaskMenu';
import { ViewMenu } from './ViewMenu';

export const TopBar: React.FC<{
  onRequestNewProject: () => void;
  onRequestTaskHistory: () => void;
  onRequestResizeCanvas?: () => void;
  onRequestExport?: () => void;
}> = ({ onRequestNewProject, onRequestTaskHistory, onRequestResizeCanvas, onRequestExport }) => {
  const { t } = useTranslation();
  const project = useProjectStore((state) => state.project);
  const setProject = useProjectStore((state) => state.setProject);
  const setProjectPath = useProjectStore((state) => state.setProjectPath);
  const activeTask = useTaskStore((state) => state.activeTask);
  const finishTask = useTaskStore((state) => state.finishTask);
  const requestStartTaskPrompt = useTaskStore((state) => state.requestStartTaskPrompt);
  const openSettings = useSettingsStore((state) => state.openSettings);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [recentProjects, setRecentProjects] = useState<string[]>([]);

  useEffect(() => {
    try {
      const recents = JSON.parse(localStorage.getItem('recentProjects') || '[]');
      setRecentProjects(recents);
    } catch {
      /* ignore */
    }
  }, [activeMenu]);

  const handleSave = async () => {
    await saveCurrentProject();
    setActiveMenu(null);
  };

  const loadProjectFromPath = async (dir: string) => {
    try {
      await loadProjectFromDisk(dir);
      // Update local recent projects state
      try {
        const recents = JSON.parse(localStorage.getItem('recentProjects') || '[]');
        setRecentProjects(recents);
      } catch {
        /* ignore */
      }
    } catch (e) {
      console.error(e);
      toast.error(t('topbar.file.open_failed', 'Failed to open project.') + '\n' + e);
    }
  };

  const handleOpen = async () => {
    try {
      const dir = await open({ directory: true, multiple: false });
      if (dir) {
        await loadProjectFromPath(dir as string);
      }
    } catch (e) {
      console.error(e);
    }
    setActiveMenu(null);
  };

  const MenuButton: React.FC<{ menuId: string; label: string }> = ({ menuId, label }) => (
    <button
      className={`px-3 py-1 rounded text-sm hover:bg-slate-700 transition-colors ${activeMenu === menuId ? 'bg-slate-700 text-white' : 'text-slate-300'}`}
      onClick={() => setActiveMenu(activeMenu === menuId ? null : menuId)}
    >
      {label}
    </button>
  );

  return (
    <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 shadow-sm select-none z-40 relative">
      <div className="flex items-center space-x-2 mr-6 text-indigo-400">
        <IconRegistry.ToolFill className="text-xl" />
        <span className="font-bold tracking-wide">{t('topbar.app_title')}</span>
      </div>

      <div className="flex space-x-1">
        <FileMenu
          isOpen={activeMenu === 'file'}
          onOpenChange={(open) => setActiveMenu(open ? 'file' : null)}
          trigger={<MenuButton menuId="file" label={t('topbar.file.menu', 'File')} />}
          hasProject={!!project}
          recentProjects={recentProjects}
          onNewProject={() => {
            onRequestNewProject();
            setActiveMenu(null);
          }}
          onOpen={handleOpen}
          onOpenRecent={(path) => {
            loadProjectFromPath(path);
            setActiveMenu(null);
          }}
          onSave={handleSave}
          onExport={() => {
            onRequestExport?.();
            setActiveMenu(null);
          }}
          onClose={() => {
            setProject(null);
            setProjectPath(null);
            setActiveMenu(null);
          }}
        />

        <EditMenu
          isOpen={activeMenu === 'edit'}
          onOpenChange={(open) => setActiveMenu(open ? 'edit' : null)}
          trigger={<MenuButton menuId="edit" label={t('topbar.edit.menu', 'Edit')} />}
          hasActiveAnimation={!!useProjectStore.getState().activeItemId}
          onResizeCanvas={() => {
            onRequestResizeCanvas?.();
            setActiveMenu(null);
          }}
          onSettings={() => {
            openSettings();
            setActiveMenu(null);
          }}
        />

        <TaskMenu
          isOpen={activeMenu === 'task'}
          onOpenChange={(open) => setActiveMenu(open ? 'task' : null)}
          trigger={<MenuButton menuId="task" label={t('topbar.task.menu', 'Task')} />}
          hasProject={!!project}
          hasActiveTask={!!activeTask}
          onStartTask={() => {
            requestStartTaskPrompt();
            setActiveMenu(null);
          }}
          onFinishTask={async () => {
            setActiveMenu(null);
            try {
              await finishTask();
            } catch (e) {
              console.error(e);
              toast.error(t('task.finish_error') + e);
            }
          }}
          onTaskHistory={() => {
            onRequestTaskHistory();
            setActiveMenu(null);
          }}
        />

        <ViewMenu
          isOpen={activeMenu === 'view'}
          onOpenChange={(open) => setActiveMenu(open ? 'view' : null)}
          trigger={<MenuButton menuId="view" label={t('topbar.view.menu', 'View')} />}
        />
      </div>

      <div className="flex-1" />

      {project && activeTask && (
        <div className="text-xs text-indigo-300 bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-700/50 mr-3 flex items-center gap-1.5">
          <IconRegistry.GitBranch className="w-3 h-3" />
          {activeTask.name}
        </div>
      )}

      {project && <FocusIndicator className="mr-4" />}

      {project && (
        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
          {project.name}
        </div>
      )}
    </div>
  );
};
