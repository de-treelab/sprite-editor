import React from 'react';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';
import { ControlledDropdown, MenuItem, MenuDivider } from '../ui';

interface FileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  hasProject: boolean;
  recentProjects: string[];
  onNewProject: () => void;
  onOpen: () => void;
  onOpenRecent: (path: string) => void;
  onSave: () => void;
  onExport: () => void;
  onClose: () => void;
}

export const FileMenu: React.FC<FileMenuProps> = ({
  isOpen,
  onOpenChange,
  trigger,
  hasProject,
  recentProjects,
  onNewProject,
  onOpen,
  onOpenRecent,
  onSave,
  onExport,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <ControlledDropdown isOpen={isOpen} onOpenChange={onOpenChange} trigger={trigger} menuClassName="w-64">
      <MenuItem icon={IconRegistry.Add} label={t('topbar.file.new', 'New Project')} onClick={onNewProject} />
      <MenuItem icon={IconRegistry.FolderOpen} label={t('topbar.file.open', 'Open Project')} onClick={onOpen} />

      {/* Open Recent Submenu */}
      <div className="relative group">
        <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white flex items-center justify-between">
          <span className="flex items-center">
            <IconRegistry.Folder className="mr-2 w-4 h-4" /> {t('topbar.file.open_recent')}
          </span>
          <span>▶</span>
        </button>
        <div className="absolute top-0 left-full ml-1 w-64 bg-slate-800 border border-slate-700 rounded shadow-xl py-1 hidden group-hover:block">
          {recentProjects.length === 0 ? (
            <div className="px-4 py-2 text-sm text-slate-500 italic">{t('topbar.file.no_recent')}</div>
          ) : (
            recentProjects.map((path, idx) => (
              <button
                key={idx}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600 hover:text-white truncate"
                title={path}
                onClick={() => onOpenRecent(path)}
              >
                {path}
              </button>
            ))
          )}
        </div>
      </div>

      <MenuDivider />
      <MenuItem
        icon={IconRegistry.Save}
        label={t('topbar.file.save', 'Save Project')}
        disabled={!hasProject}
        onClick={onSave}
      />
      <MenuItem
        icon={IconRegistry.Download}
        label={t('topbar.file.export', 'Export...')}
        disabled={!hasProject}
        onClick={onExport}
      />
      <MenuDivider />
      <MenuItem
        icon={IconRegistry.VisibleOff}
        label={t('topbar.file.close', 'Close Project')}
        disabled={!hasProject}
        danger
        onClick={onClose}
      />
    </ControlledDropdown>
  );
};
