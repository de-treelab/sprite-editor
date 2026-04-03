import React from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import { getAllViews } from '../../layouts/viewRegistry';
import { viewExistsInTree } from '../../layouts/layoutUtils';
import { executeCommand } from '../../config/commandRegistry';
import { ControlledDropdown, MenuItem, MenuDivider } from '../ui';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';

interface ViewMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export const ViewMenu: React.FC<ViewMenuProps> = ({ isOpen, onOpenChange, trigger }) => {
  const { t } = useTranslation();
  const layout = useLayoutStore((s) => s.layout);
  const floatView = useLayoutStore((s) => s.floatView);
  const toggleViewHidden = useLayoutStore((s) => s.toggleViewHidden);
  const resetLayout = useLayoutStore((s) => s.resetLayout);
  const setFullscreenView = useLayoutStore((s) => s.setFullscreenView);
  const savedLayouts = useLayoutStore((s) => s.savedLayouts);
  const loadLayout = useLayoutStore((s) => s.loadLayout);

  const allViews = getAllViews();

  const isViewPresent = (viewId: string) =>
    viewExistsInTree(layout.root, viewId) || layout.floating.some((f) => f.viewIds.includes(viewId));

  const isViewVisible = (viewId: string) => isViewPresent(viewId) && !layout.hiddenViewIds.includes(viewId);

  const handleViewClick = (viewId: string) => {
    if (isViewPresent(viewId)) {
      if (layout.hiddenViewIds.includes(viewId)) {
        toggleViewHidden(viewId);
      }
      // If visible, toggle hidden to close it
      else {
        toggleViewHidden(viewId);
      }
    } else {
      // Open as floating
      floatView(viewId, {
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 150,
      });
    }
    onOpenChange(false);
  };

  const handleResetLayout = () => {
    resetLayout();
    onOpenChange(false);
  };

  const handleExitFullscreen = () => {
    setFullscreenView(null);
    onOpenChange(false);
  };

  const handleLoadLayout = (id: string) => {
    loadLayout(id);
    onOpenChange(false);
  };

  return (
    <ControlledDropdown isOpen={isOpen} onOpenChange={onOpenChange} trigger={trigger}>
      {allViews.map((view) => (
        <MenuItem
          key={view.id}
          label={view.title}
          icon={isViewVisible(view.id) ? IconRegistry.GitCommit : undefined}
          onClick={() => handleViewClick(view.id)}
        />
      ))}

      <MenuDivider />

      {layout.fullscreenViewId && <MenuItem label={t('topbar.view.exit_fullscreen')} onClick={handleExitFullscreen} />}

      <MenuItem label={t('topbar.view.reset_layout')} onClick={handleResetLayout} />

      <MenuItem
        label={t('topbar.view.save_layout')}
        icon={IconRegistry.Save}
        onClick={() => {
          executeCommand('global.saveLayout');
          onOpenChange(false);
        }}
      />

      <MenuItem
        label={t('topbar.view.manage_layouts')}
        icon={IconRegistry.Layout}
        onClick={() => {
          executeCommand('global.manageLayouts');
          onOpenChange(false);
        }}
      />

      {savedLayouts.length > 0 && (
        <>
          <MenuDivider />
          {savedLayouts.map((sl) => (
            <MenuItem key={sl.id} label={sl.name} onClick={() => handleLoadLayout(sl.id)} />
          ))}
        </>
      )}
    </ControlledDropdown>
  );
};
