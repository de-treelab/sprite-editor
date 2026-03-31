import React, { useState, useRef, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { IconRegistry } from '../IconRegistry';
import { NewSpritesheetModal } from '../Modals/NewSpritesheetModal';
import { NewAnimationModal } from '../Modals/NewAnimationModal';
import { IconButton, SimpleListItem, InlineEditInput } from '../ui';
import { AnimationListItem } from './AnimationListItem';

type NavLevel = 'sheets' | 'animations';

export const SpritesheetSidebar: React.FC = () => {
  const project = useProjectStore(state => state.project);
  const activeSpritesheetId = useProjectStore(state => state.activeSpritesheetId);
  const setActiveSpritesheet = useProjectStore(state => state.setActiveSpritesheet);
  const activeAnimationId = useProjectStore(state => state.activeAnimationId);
  const setActiveAnimation = useProjectStore(state => state.setActiveAnimation);
  const updateSpritesheet = useProjectStore(state => state.updateSpritesheet);
  const updateAnimation = useProjectStore(state => state.updateAnimation);
  const setFocusedView = useEditorStore(state => state.setFocusedView);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSpriteModal, setShowSpriteModal] = useState(false);
  const [animModalSheetId, setAnimModalSheetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Keyboard navigation state
  const [navLevel, setNavLevel] = useState<NavLevel>('sheets');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleRenameSave = (type: 'sheet' | 'anim', parentId: string | null, id: string, name: string) => {
    if (name.trim()) {
      if (type === 'sheet') {
        updateSpritesheet(id, { name: name.trim() });
      } else if (type === 'anim' && parentId) {
        updateAnimation(parentId, id, { name: name.trim() });
      }
    }
    setEditingId(null);
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!project || editingId) return;

    const sheets = project.spritesheets;
    if (sheets.length === 0) return;

    const activeSheet = sheets.find(s => s.id === activeSpritesheetId);

    if (navLevel === 'sheets') {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(highlightedIndex + 1, sheets.length - 1);
          setHighlightedIndex(next);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(highlightedIndex - 1, 0);
          setHighlightedIndex(prev);
          break;
        }
        case ' ':
        case 'ArrowRight': {
          e.preventDefault();
          const sheet = sheets[highlightedIndex];
          if (sheet) {
            setActiveSpritesheet(sheet.id);
            if (sheet.animations.length > 0) {
              setNavLevel('animations');
              setHighlightedIndex(0);
            }
          }
          break;
        }
      }
    } else if (navLevel === 'animations' && activeSheet) {
      const anims = activeSheet.animations;
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(highlightedIndex + 1, anims.length - 1);
          setHighlightedIndex(next);
          const anim = anims[next];
          if (anim) setActiveAnimation(anim.id);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(highlightedIndex - 1, 0);
          setHighlightedIndex(prev);
          const anim = anims[prev];
          if (anim) setActiveAnimation(anim.id);
          break;
        }
        case 'ArrowLeft': {
          e.preventDefault();
          setNavLevel('sheets');
          const sheetIdx = sheets.findIndex(s => s.id === activeSpritesheetId);
          setHighlightedIndex(sheetIdx >= 0 ? sheetIdx : 0);
          break;
        }
        case ' ':
        case 'Enter': {
          e.preventDefault();
          const anim = anims[highlightedIndex];
          if (anim) setActiveAnimation(anim.id);
          break;
        }
      }
    }
  }, [project, activeSpritesheetId, navLevel, highlightedIndex, editingId, setActiveSpritesheet, setActiveAnimation]);

  if (!project) return null;

  if (isCollapsed) {
    return (
      <div className="w-10 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-2 h-full z-10 transition-all">
        <IconButton
          icon={IconRegistry.FolderOpen}
          onClick={() => setIsCollapsed(false)}
          label="Expand"
        />
      </div>
    );
  }

  return (
    <>
      <div
        ref={listRef}
        className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full z-10 transition-all flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        tabIndex={0}
        onFocus={() => setFocusedView('navigator')}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-slate-700">
          <span className="font-bold text-sm text-slate-300">Spritesheets</span>
          <div className="flex space-x-1">
            <IconButton
              icon={IconRegistry.Add}
              size="sm"
              onClick={() => setShowSpriteModal(true)}
              label="New Spritesheet"
            />
            <IconButton
              icon={IconRegistry.Folder}
              size="sm"
              onClick={() => setIsCollapsed(true)}
              label="Collapse"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {project.spritesheets.map((sheet, sheetIndex) => {
            const isSelected = activeSpritesheetId === sheet.id;
            const isSheetHighlighted = navLevel === 'sheets' && highlightedIndex === sheetIndex;
            return (
              <div key={sheet.id} className="select-none mb-1">
                <SimpleListItem
                  isSelected={isSelected}
                  onClick={() => {
                    setActiveSpritesheet(sheet.id);
                    setNavLevel('sheets');
                    setHighlightedIndex(sheetIndex);
                  }}
                  onDoubleClick={() => setEditingId(sheet.id)}
                  className={isSheetHighlighted ? 'ring-1 ring-indigo-400' : ''}
                >
                  <IconRegistry.File className="mr-2 text-sm flex-shrink-0" />
                  {editingId === sheet.id ? (
                    <InlineEditInput
                      value={sheet.name}
                      onSave={(name) => handleRenameSave('sheet', null, sheet.id, name)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <span className="text-sm truncate select-none">{sheet.name}</span>
                  )}
                </SimpleListItem>

                {isSelected && (
                  <div className="ml-4 mt-1 space-y-1">
                    {sheet.animations.map((anim, animIndex) => (
                      <AnimationListItem
                        key={anim.id}
                        animation={anim}
                        sheetId={sheet.id}
                        isSelected={activeAnimationId === anim.id}
                        isEditing={editingId === anim.id}
                        className={navLevel === 'animations' && highlightedIndex === animIndex ? 'ring-1 ring-indigo-400' : ''}
                        onSelect={() => {
                          setActiveAnimation(anim.id);
                          setNavLevel('animations');
                          setHighlightedIndex(animIndex);
                        }}
                        onStartEdit={() => setEditingId(anim.id)}
                        onSaveEdit={(name) => handleRenameSave('anim', sheet.id, anim.id, name)}
                        onCancelEdit={() => setEditingId(null)}
                      />
                    ))}
                    <div
                      className="flex items-center p-1 text-xs rounded cursor-pointer text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnimModalSheetId(sheet.id);
                      }}
                    >
                      <span className="mr-2 font-bold">+</span>
                      <span>New Animation</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div
            className="flex items-center p-1 mt-2 text-sm rounded cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
            onClick={() => setShowSpriteModal(true)}
          >
            <span className="mr-2 font-bold">+</span>
            <span>New Spritesheet</span>
          </div>
        </div>
      </div>

      {showSpriteModal && <NewSpritesheetModal onClose={() => setShowSpriteModal(false)} />}
      {animModalSheetId && <NewAnimationModal spritesheetId={animModalSheetId} onClose={() => setAnimModalSheetId(null)} />}
    </>
  );
};
