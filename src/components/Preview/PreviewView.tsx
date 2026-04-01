import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { PreviewPlayer } from './PreviewPlayer';
import { EmptyState } from '../ui';
import { IconRegistry } from '../IconRegistry';

/** Preview view wrapper for the layout system */
export const PreviewView: React.FC = () => {
  const activeItemId = useProjectStore(state => state.activeItemId);
  const activeItemType = useProjectStore(state => state.activeItemType);

  if (!activeItemId || activeItemType === 'image') {
    return (
      <EmptyState
        icon={<IconRegistry.Play />}
        title={activeItemType === 'image' ? 'Preview disabled for images' : 'Select an animation'}
      />
    );
  }

  return <PreviewPlayer />;
};
