import React from 'react';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';
import { ControlledDropdown, MenuItem, MenuDivider } from '../ui';

interface EditMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  onSettings: () => void;
  onResizeCanvas?: () => void;
  hasActiveAnimation?: boolean;
}

export const EditMenu: React.FC<EditMenuProps> = ({
  isOpen,
  onOpenChange,
  trigger,
  onSettings,
  onResizeCanvas,
  hasActiveAnimation,
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
        icon={IconRegistry.Undo}
        label={t('topbar.edit.undo', 'Undo')}
        shortcut="Ctrl+Z"
      />
      <MenuItem
        icon={IconRegistry.Redo}
        label={t('topbar.edit.redo', 'Redo')}
        shortcut="Ctrl+Y"
      />
      <MenuDivider />
      {hasActiveAnimation && (
        <MenuItem
          label={t('topbar.edit.resizeCanvas', 'Resize Canvas…')}
          onClick={onResizeCanvas}
        />
      )}
      <MenuItem
        icon={IconRegistry.Settings}
        label={t('topbar.edit.settings', 'Settings')}
        onClick={onSettings}
      />
    </ControlledDropdown>
  );
};
