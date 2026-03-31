import React from 'react';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';
import { ControlledDropdown, MenuItem, MenuDivider } from '../ui';

interface TaskMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  hasProject: boolean;
  hasActiveTask: boolean;
  onStartTask: () => void;
  onFinishTask: () => void;
  onTaskHistory: () => void;
}

export const TaskMenu: React.FC<TaskMenuProps> = ({
  isOpen,
  onOpenChange,
  trigger,
  hasProject,
  hasActiveTask,
  onStartTask,
  onFinishTask,
  onTaskHistory,
}) => {
  const { t } = useTranslation();

  return (
    <ControlledDropdown
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      trigger={trigger}
      menuClassName="w-48"
    >
      <MenuItem
        icon={IconRegistry.Add}
        label={t('topbar.task.start', 'Start Task')}
        disabled={!hasProject}
        onClick={onStartTask}
      />
      <MenuItem
        icon={IconRegistry.GitCommit}
        label={t('topbar.task.finish', 'Finish Task')}
        disabled={!hasProject || !hasActiveTask}
        onClick={onFinishTask}
      />
      <MenuDivider />
      <MenuItem
        icon={IconRegistry.GitBranch}
        label={t('topbar.task.history', 'Task History')}
        disabled={!hasProject}
        onClick={onTaskHistory}
      />
    </ControlledDropdown>
  );
};
