import React from 'react';
import { IconRegistry } from '../IconRegistry';
import { InlineEditInput } from '../ui';
import type { ActiveItemType } from '../../types/project';

interface ItemData {
  id: string;
  name: string;
}

interface ItemListEntryProps {
  item: ItemData;
  itemType: ActiveItemType;
  sheetId: string;
  isSelected: boolean;
  isEditing: boolean;
  className?: string;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveEdit: (name: string) => void;
  onCancelEdit: () => void;
}

export const ItemListEntry: React.FC<ItemListEntryProps> = ({
  item,
  itemType,
  isSelected,
  isEditing,
  className = '',
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}) => (
  <div
    className={`flex items-center p-1 text-xs rounded cursor-pointer ${
      isSelected
        ? 'bg-indigo-500/50 text-white'
        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
    } ${className}`}
    onClick={(e) => {
      e.stopPropagation();
      onSelect();
    }}
    onDoubleClick={(e) => {
      e.stopPropagation();
      onStartEdit();
    }}
  >
    {itemType === 'image' ? (
      <IconRegistry.File className="mr-2 text-xs flex-shrink-0 text-amber-400" />
    ) : (
      <IconRegistry.Play className="mr-2 text-xs flex-shrink-0" />
    )}
    {isEditing ? (
      <InlineEditInput
        value={item.name}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />
    ) : (
      <span className="truncate select-none">{item.name}</span>
    )}
  </div>
);
