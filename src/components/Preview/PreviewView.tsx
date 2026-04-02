import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { PreviewPlayer } from './PreviewPlayer';
import { EmptyState } from '../ui';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';

/** Preview view wrapper for the layout system */
export const PreviewView: React.FC = () => {
  const { t } = useTranslation();
  const activeItemId = useProjectStore(state => state.activeItemId);
  const activeItemType = useProjectStore(state => state.activeItemType);

  if (!activeItemId || activeItemType === 'image') {
    return (
      <EmptyState
        icon={<IconRegistry.Play />}
        title={activeItemType === 'image' ? t('preview_view.disabled_for_images') : t('preview_view.select_animation')}
      />
    );
  }

  return <PreviewPlayer />;
};
