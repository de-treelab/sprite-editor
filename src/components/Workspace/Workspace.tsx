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
import type { ViewType } from '../../config/keybindings';

export const Workspace: React.FC = () => {
  
  const activeSpritesheetId = useProjectStore(state => state.activeSpritesheetId);
  const activeFrameId = useProjectStore(state => state.activeFrameId);
  const activeAnimationId = useProjectStore(state => state.activeAnimationId);
  const hiddenViews = useEditorStore(state => state.hiddenViews);
  const fullscreenView = useEditorStore(state => state.fullscreenView);

  const isVisible = (view: ViewType) => !hiddenViews.has(view) && (!fullscreenView || fullscreenView === view);

  if (!activeSpritesheetId) {
    return (
      <div className="flex-1 bg-slate-800 flex items-center justify-center">
        <EmptyState
          icon={<IconRegistry.Folder />}
          title="Select or create a new spritesheet to begin"
        />
      </div>
    );
  }

  // Fullscreen mode: render only the fullscreened view
  if (fullscreenView) {
    return (
      <div className="flex flex-1 overflow-hidden bg-slate-800">
        <div className="flex flex-col flex-1 overflow-hidden">
          {fullscreenView === 'canvas' && (
            !activeFrameId ? (
              <EmptyState icon={<IconRegistry.File />} title="Select a frame to edit" />
            ) : (
              <PixiEditor />
            )
          )}
          {fullscreenView === 'preview' && (
            !activeAnimationId ? (
              <EmptyState icon={<IconRegistry.Play />} title="Select an animation" />
            ) : (
              <PreviewPlayer />
            )
          )}
          {fullscreenView === 'timeline' && (
            !activeAnimationId ? (
              <EmptyState icon={<IconRegistry.Play />} title="Select an animation to edit keyframes" />
            ) : (
              <KeyframeEditor />
            )
          )}
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
                  <EmptyState icon={<IconRegistry.File />} title="Select a frame to edit" />
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
              {!activeAnimationId ? (
                <EmptyState icon={<IconRegistry.Play />} title="Select an animation" />
              ) : (
                <PreviewPlayer />
              )}
            </div>
          )}

        </div>

        {/* Bottom Row: Keyframe Editor */}
        {isVisible('timeline') && (
          <div className="h-64 border-t border-slate-700 flex flex-col bg-slate-900">
            {!activeAnimationId ? (
              <EmptyState icon={<IconRegistry.Play />} title="Select an animation to edit keyframes" />
            ) : (
              <KeyframeEditor />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
