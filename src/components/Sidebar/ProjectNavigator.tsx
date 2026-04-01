import React, { useState, useRef, useCallback } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { IconRegistry } from '../IconRegistry';
import { NewSpritesheetModal } from '../Modals/NewSpritesheetModal';
import { NewItemModal } from '../Modals/NewItemModal';
import { IconButton, SimpleListItem, InlineEditInput } from '../ui';
import { ItemListEntry } from './ItemListEntry';

type NavLevel = 'sheets' | 'items';

export const ProjectNavigator: React.FC = () => {
  const project = useProjectStore(state => state.project);
  const activeSpritesheetId = useProjectStore(state => state.activeSpritesheetId);
  const setActiveSpritesheet = useProjectStore(state => state.setActiveSpritesheet);
  const activeItemId = useProjectStore(state => state.activeItemId);
  const setActiveItem = useProjectStore(state => state.setActiveItem);
  const updateSpritesheet = useProjectStore(state => state.updateSpritesheet);
  const updateAnimation = useProjectStore(state => state.updateAnimation);
  const updateImage = useProjectStore(state => state.updateImage);
  const setFocusedView = useEditorStore(state => state.setFocusedView);

  const [showSpriteModal, setShowSpriteModal] = useState(false);
  const [itemModalSheetId, setItemModalSheetId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Keyboard navigation state
  const [navLevel, setNavLevel] = useState<NavLevel>('sheets');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleRenameSave = (type: 'sheet' | 'anim' | 'image', parentId: string | null, id: string, name: string) => {
    if (name.trim()) {
      if (type === 'sheet') {
        updateSpritesheet(id, { name: name.trim() });
      } else if (type === 'anim' && parentId) {
        updateAnimation(parentId, id, { name: name.trim() });
      } else if (type === 'image' && parentId) {
        updateImage(parentId, id, { name: name.trim() });
      }
    }
    setEditingId(null);
  };

  /** Build a flat list of animations + images for the given sheet. */
  const getSheetItems = useCallback((sheet: { animations: { id: string; name: string }[]; images?: { id: string; name: string }[] }) => {
    const items: { id: string; name: string; type: 'animation' | 'image' }[] = [];
    for (const a of sheet.animations) items.push({ id: a.id, name: a.name, type: 'animation' });
    for (const i of (sheet.images || [])) items.push({ id: i.id, name: i.name, type: 'image' });
    return items;
  }, []);

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
            const items = getSheetItems(sheet);
            if (items.length > 0) {
              setNavLevel('items');
              setHighlightedIndex(0);
            }
          }
          break;
        }
      }
    } else if (navLevel === 'items' && activeSheet) {
      const items = getSheetItems(activeSheet);
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(highlightedIndex + 1, items.length - 1);
          setHighlightedIndex(next);
          const item = items[next];
          if (item) setActiveItem(item.id, item.type);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(highlightedIndex - 1, 0);
          setHighlightedIndex(prev);
          const item = items[prev];
          if (item) setActiveItem(item.id, item.type);
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
          const item = items[highlightedIndex];
          if (item) setActiveItem(item.id, item.type);
          break;
        }
      }
    }
  }, [project, activeSpritesheetId, navLevel, highlightedIndex, editingId, setActiveSpritesheet, setActiveItem, getSheetItems]);

  if (!project) return null;

  return (
    <>
      <div
        ref={listRef}
        className="bg-slate-800 flex flex-col h-full flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        tabIndex={0}
        onFocus={() => setFocusedView('navigator')}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-slate-700">
          <span className="font-bold text-sm text-slate-300">Project</span>
          <div className="flex space-x-1">
            <IconButton
              icon={IconRegistry.Add}
              size="sm"
              onClick={() => setShowSpriteModal(true)}
              label="New Spritesheet"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {project.spritesheets.map((sheet, sheetIndex) => {
            const isSelected = activeSpritesheetId === sheet.id;
            const isSheetHighlighted = navLevel === 'sheets' && highlightedIndex === sheetIndex;
            const items = getSheetItems(sheet);
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
                    {items.map((item, itemIndex) => (
                      <ItemListEntry
                        key={item.id}
                        item={item}
                        itemType={item.type}
                        sheetId={sheet.id}
                        isSelected={activeItemId === item.id}
                        isEditing={editingId === item.id}
                        className={navLevel === 'items' && highlightedIndex === itemIndex ? 'ring-1 ring-indigo-400' : ''}
                        onSelect={() => {
                          setActiveItem(item.id, item.type);
                          setNavLevel('items');
                          setHighlightedIndex(itemIndex);
                        }}
                        onStartEdit={() => setEditingId(item.id)}
                        onSaveEdit={(name) => handleRenameSave(item.type === 'image' ? 'image' : 'anim', sheet.id, item.id, name)}
                        onCancelEdit={() => setEditingId(null)}
                      />
                    ))}
                    <div
                      className="flex items-center p-1 text-xs rounded cursor-pointer text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemModalSheetId(sheet.id);
                      }}
                    >
                      <span className="mr-2 font-bold">+</span>
                      <span>New...</span>
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
      {itemModalSheetId && <NewItemModal spritesheetId={itemModalSheetId} onClose={() => setItemModalSheetId(null)} />}
    </>
  );
};
