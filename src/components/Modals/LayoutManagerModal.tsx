import React, { useState } from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import { useProjectStore } from '../../store/projectStore';
import { Modal, TextInput } from '../ui';
import { IconRegistry } from '../IconRegistry';

interface Props {
  onClose: () => void;
}

export const LayoutManagerModal: React.FC<Props> = ({ onClose }) => {
  const savedLayouts = useLayoutStore(s => s.savedLayouts);
  const loadLayout = useLayoutStore(s => s.loadLayout);
  const deleteLayout = useLayoutStore(s => s.deleteLayout);
  const renameLayout = useLayoutStore(s => s.renameLayout);
  const setProjectLayout = useLayoutStore(s => s.setProjectLayout);
  const projectLayoutMap = useLayoutStore(s => s.projectLayoutMap);
  const activeLayoutId = useLayoutStore(s => s.activeLayoutId);
  const projectPath = useProjectStore(s => s.projectPath);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const boundLayoutId = projectPath ? projectLayoutMap[projectPath] : undefined;

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      renameLayout(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleLoad = (id: string) => {
    loadLayout(id);
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteLayout(id);
    setConfirmDeleteId(null);
  };

  const handleBindToProject = (layoutId: string) => {
    if (!projectPath) return;
    if (boundLayoutId === layoutId) {
      // Unbind
      setProjectLayout(projectPath, '');
    } else {
      setProjectLayout(projectPath, layoutId);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Manage Layouts" size="md">
      {savedLayouts.length === 0 ? (
        <p className="text-sm text-slate-400">No saved layouts. Use "Save Layout" to create one.</p>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {savedLayouts.map(layout => (
            <div
              key={layout.id}
              className={`flex items-center gap-2 p-2 rounded group ${
                activeLayoutId === layout.id
                  ? 'bg-indigo-500/10 border border-indigo-500/30'
                  : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent'
              }`}
            >
              {editingId === layout.id ? (
                <TextInput
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  size="sm"
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={commitRename}
                />
              ) : (
                <span className="flex-1 text-sm text-slate-200 truncate">
                  {layout.name}
                  {activeLayoutId === layout.id && (
                    <span className="ml-2 text-xs text-indigo-400">(active)</span>
                  )}
                  {boundLayoutId === layout.id && (
                    <span className="ml-1 text-xs text-emerald-400">(project)</span>
                  )}
                </span>
              )}

              {editingId !== layout.id && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white"
                    onClick={() => handleLoad(layout.id)}
                    title="Load layout"
                  >
                    <IconRegistry.FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white"
                    onClick={() => startRename(layout.id, layout.name)}
                    title="Rename"
                  >
                    <IconRegistry.Edit className="w-3.5 h-3.5" />
                  </button>
                  {projectPath && (
                    <button
                      className={`p-1 rounded hover:bg-slate-600 ${
                        boundLayoutId === layout.id ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                      }`}
                      onClick={() => handleBindToProject(layout.id)}
                      title={boundLayoutId === layout.id ? 'Unbind from project' : 'Bind to project'}
                    >
                      <IconRegistry.Link className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {confirmDeleteId === layout.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        className="px-1.5 py-0.5 text-xs rounded bg-red-600 hover:bg-red-500 text-white"
                        onClick={() => handleDelete(layout.id)}
                      >
                        Delete
                      </button>
                      <button
                        className="px-1.5 py-0.5 text-xs rounded bg-slate-600 hover:bg-slate-500 text-slate-300"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-red-400"
                      onClick={() => setConfirmDeleteId(layout.id)}
                      title="Delete"
                    >
                      <IconRegistry.Delete className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          className="px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  );
};
