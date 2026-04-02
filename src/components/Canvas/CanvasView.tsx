import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { PixiEditor } from './PixiEditor';
import { EmptyState } from '../ui';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';

/** Canvas view wrapper for the layout system */
export const CanvasView: React.FC = () => {
  const { t } = useTranslation();
  const activeFrameId = useProjectStore((state) => state.activeFrameId);
  const activeSpritesheetId = useProjectStore((state) => state.activeSpritesheetId);

  if (!activeSpritesheetId) {
    return <EmptyState icon={<IconRegistry.Folder />} title={t('canvas.select_spritesheet')} />;
  }

  if (!activeFrameId) {
    return <EmptyState icon={<IconRegistry.File />} title={t('canvas.select_frame')} />;
  }

  return <PixiEditor />;
};
