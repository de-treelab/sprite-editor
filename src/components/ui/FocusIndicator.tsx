import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { viewDisplayNames } from '../../config/keybindings';

/**
 * A small indicator showing the currently focused view.
 * Typically placed in the top bar or status bar area.
 */
export const FocusIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const focusedView = useEditorStore((state) => state.focusedView);
  const keybindings = useEditorStore((state) => state.keybindings);

  if (!focusedView) {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-500 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-slate-600" />
        <span>No focus</span>
      </div>
    );
  }

  // Get the shortcut for this view
  const shortcutMap: Record<string, string> = {
    canvas: keybindings.global.focusCanvas,
    timeline: keybindings.global.focusTimeline,
    preview: keybindings.global.focusPreview,
    navigator: keybindings.global.focusNavigator,
  };

  const shortcut = shortcutMap[focusedView];
  const displayName = viewDisplayNames[focusedView];

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
      <span className="text-slate-300">{displayName}</span>
      {shortcut && (
        <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-400 font-mono text-[10px]">
          {shortcut.replace('ctrl+', '⌃').replace('shift+', '⇧').replace('alt+', '⌥')}
        </kbd>
      )}
    </div>
  );
};
