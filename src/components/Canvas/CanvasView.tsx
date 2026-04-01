import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { PixiEditor } from './PixiEditor';
import { EmptyState } from '../ui';
import { IconRegistry } from '../IconRegistry';

/** Canvas view wrapper for the layout system */
export const CanvasView: React.FC = () => {
  const activeFrameId = useProjectStore(state => state.activeFrameId);
  const activeSpritesheetId = useProjectStore(state => state.activeSpritesheetId);

  if (!activeSpritesheetId) {
    return <EmptyState icon={<IconRegistry.Folder />} title="Select or create a spritesheet" />;
  }

  if (!activeFrameId) {
    return <EmptyState icon={<IconRegistry.File />} title="Select a frame to edit" />;
  }

  return <PixiEditor />;
};
