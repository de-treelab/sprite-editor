import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { KeyframeEditor } from './KeyframeEditor';
import { EmptyState } from '../ui';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';

/** Timeline view wrapper for the layout system */
export const TimelineView: React.FC = () => {
  const { t } = useTranslation();
  const activeItemId = useProjectStore((state) => state.activeItemId);
  const activeItemType = useProjectStore((state) => state.activeItemType);

  if (!activeItemId || activeItemType === 'image') {
    return (
      <EmptyState
        icon={<IconRegistry.Play />}
        title={activeItemType === 'image' ? t('timeline.disabled_for_images') : t('timeline.select_animation')}
      />
    );
  }

  return <KeyframeEditor />;
};
