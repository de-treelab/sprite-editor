import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { Sidebar } from '../Sidebar/Sidebar';
import { RightSidebar } from '../Sidebar/RightSidebar';
import { PixiEditor } from '../Canvas/PixiEditor';
import { KeyframeEditor } from '../Timeline/KeyframeEditor';
import { PreviewPlayer } from '../Preview/PreviewPlayer';
import { IconRegistry } from '../IconRegistry';
import { EmptyState } from '../ui';
import { useTranslation } from 'react-i18next';
import type { ViewType } from '../../config/keybindings';

export const Workspace: React.FC = () => {
  const { t } = useTranslation();

  const activeSpritesheetId = useProjectStore((state) => state.activeSpritesheetId);
  const activeFrameId = useProjectStore((state) => state.activeFrameId);
  const activeItemId = useProjectStore((state) => state.activeItemId);
  const activeItemType = useProjectStore((state) => state.activeItemType);
  const hiddenViews = useEditorStore((state) => state.hiddenViews);
  const fullscreenView = useEditorStore((state) => state.fullscreenView);

  const isVisible = (view: ViewType) => !hiddenViews.has(view) && (!fullscreenView || fullscreenView === view);

  if (!activeSpritesheetId) {
    return (
      <div className="flex-1 bg-slate-800 flex items-center justify-center">
        <EmptyState icon={<IconRegistry.Folder />} title={t('workspace.select_spritesheet')} />
      </div>
    );
  }

  // Fullscreen mode: render only the fullscreened view
  if (fullscreenView) {
    return (
      <div className="flex flex-1 overflow-hidden bg-slate-800">
        <div className="flex flex-col flex-1 overflow-hidden">
          {fullscreenView === 'canvas' &&
            (!activeFrameId ? (
              <EmptyState icon={<IconRegistry.File />} title={t('canvas.select_frame')} />
            ) : (
              <PixiEditor />
            ))}
          {fullscreenView === 'preview' &&
            (!activeItemId || activeItemType === 'image' ? (
              <EmptyState
                icon={<IconRegistry.Play />}
                title={
                  activeItemType === 'image'
                    ? t('preview_view.disabled_for_images')
                    : t('preview_view.select_animation')
                }
              />
            ) : (
              <PreviewPlayer />
            ))}
          {fullscreenView === 'timeline' &&
            (!activeItemId || activeItemType === 'image' ? (
              <EmptyState
                icon={<IconRegistry.Play />}
                title={activeItemType === 'image' ? t('timeline.disabled_for_images') : t('timeline.select_animation')}
              />
            ) : (
              <KeyframeEditor />
            ))}
          {fullscreenView === 'navigator' && <Sidebar />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-slate-800">
      {/* Main Column */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Row: Frame Editor + Preview */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Frame Editor Container with sidebars */}
          {isVisible('canvas') && (
            <div className="flex-1 flex flex-row min-w-0">
              {isVisible('navigator') && <Sidebar />}

              <div className="flex-1 flex flex-col min-w-0 bg-slate-800">
                {!activeFrameId ? (
                  <EmptyState icon={<IconRegistry.File />} title={t('canvas.select_frame')} />
                ) : (
                  <PixiEditor />
                )}
              </div>

              <RightSidebar />
            </div>
          )}

          {/* Preview View Container */}
          {isVisible('preview') && (
            <div className="w-64 lg:w-80 flex flex-col bg-slate-900 border-l border-slate-700">
              <div className="p-2 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-800 border-b border-slate-700 text-center">
                Preview
              </div>
              {!activeItemId || activeItemType === 'image' ? (
                <EmptyState
                  icon={<IconRegistry.Play />}
                  title={
                    activeItemType === 'image'
                      ? t('preview_view.disabled_for_images')
                      : t('preview_view.select_animation')
                  }
                />
              ) : (
                <PreviewPlayer />
              )}
            </div>
          )}
        </div>

        {/* Bottom Row: Keyframe Editor */}
        {isVisible('timeline') && (
          <div className="h-64 border-t border-slate-700 flex flex-col bg-slate-900">
            {!activeItemId || activeItemType === 'image' ? (
              <EmptyState
                icon={<IconRegistry.Play />}
                title={activeItemType === 'image' ? t('timeline.disabled_for_images') : t('timeline.select_animation')}
              />
            ) : (
              <KeyframeEditor />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
