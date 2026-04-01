import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { KeyframeEditor } from './KeyframeEditor';
import { EmptyState } from '../ui';
import { IconRegistry } from '../IconRegistry';

/** Timeline view wrapper for the layout system */
export const TimelineView: React.FC = () => {
  const activeItemId = useProjectStore(state => state.activeItemId);
  const activeItemType = useProjectStore(state => state.activeItemType);

  if (!activeItemId || activeItemType === 'image') {
    return (
      <EmptyState
        icon={<IconRegistry.Play />}
        title={activeItemType === 'image' ? 'Timeline disabled for images' : 'Select an animation to edit keyframes'}
      />
    );
  }

  return <KeyframeEditor />;
};
