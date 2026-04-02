import React, { useState } from 'react';
import { IconRegistry } from '../IconRegistry';
import { useProjectStore } from '../../store/projectStore';
import { useTranslation } from 'react-i18next';
import {
  RangeSlider,
  IconButton,
  ListItem,
  InlineEditInput,
} from '../ui';

interface Layer {
  id: string;
  name: string;
  opacity: number;
  blendMode: string;
  visible: boolean;
  locked: boolean;
  isReference: boolean;
  data: string;
}

interface LayerListItemProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export const LayerListItem: React.FC<LayerListItemProps> = ({
  layer,
  index,
  isActive,
  isDragging,
  isDragOver,
  onSelect,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const [editingName, setEditingName] = useState(false);
  const { t } = useTranslation();
  const activeSpritesheetId = useProjectStore(state => state.activeSpritesheetId);
  const activeFrameId = useProjectStore(state => state.activeFrameId);
  const updateLayer = useProjectStore(state => state.updateLayer);

  return (
    <ListItem
      isSelected={isActive}
      isDragging={isDragging}
      isDragOver={isDragOver}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className="flex-col !items-stretch"
    >
      <div className="flex items-center gap-2 mb-1">
        <IconButton
          icon={layer.visible ? IconRegistry.VisibleOn : IconRegistry.VisibleOff}
          size="sm"
          variant="toggle"
          isActive={layer.visible}
          onClick={(e) => { e.stopPropagation(); updateLayer(activeSpritesheetId!, activeFrameId!, layer.id, { visible: !layer.visible }); }}
          label={layer.visible ? t('sidebar.hide_layer') : t('sidebar.show_layer')}
        />

        <IconButton
          icon={layer.locked ? IconRegistry.LockOn : IconRegistry.LockOff}
          size="sm"
          variant="toggle"
          isActive={layer.locked}
          onClick={(e) => { e.stopPropagation(); updateLayer(activeSpritesheetId!, activeFrameId!, layer.id, { locked: !layer.locked }); }}
          label={layer.locked ? t('sidebar.unlock_layer') : t('sidebar.lock_layer')}
          className={layer.locked ? '!text-rose-400' : ''}
        />

        {editingName ? (
          <InlineEditInput
            value={layer.name}
            onSave={(name) => {
              updateLayer(activeSpritesheetId!, activeFrameId!, layer.id, { name });
              setEditingName(false);
            }}
            onCancel={() => setEditingName(false)}
          />
        ) : (
          <span
            className={`flex-1 text-sm truncate select-none ${layer.isReference ? 'text-amber-400 italic' : 'font-semibold text-slate-200'} ${!layer.visible && 'opacity-50'}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
            }}
            title={layer.isReference ? t('sidebar.reference_tooltip') : t('sidebar.rename_tooltip')}
          >
            {layer.name}
          </span>
        )}

        <button
          className={`shrink-0 hover:text-white ${layer.isReference ? 'text-amber-400' : 'text-slate-500'}`}
          onClick={(e) => {
            e.stopPropagation();
            updateLayer(activeSpritesheetId!, activeFrameId!, layer.id, { isReference: !layer.isReference });
          }}
          title={t('sidebar.toggle_reference')}
        >
          <span className="text-[10px] font-mono border border-current rounded px-1">REF</span>
        </button>

        <IconButton
          icon={IconRegistry.Delete}
          size="sm"
          variant="danger"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          label={t('sidebar.delete_layer')}
        />
      </div>

      {isActive && (
        <div className="mt-2 pt-2 border-t border-slate-600/50" onClick={(e) => e.stopPropagation()}>
          <RangeSlider
            label="OPC"
            value={layer.opacity}
            onChange={(v) => updateLayer(activeSpritesheetId!, activeFrameId!, layer.id, { opacity: v })}
            min={0}
            max={1}
            step={0.05}
            valueFormatter={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      )}
    </ListItem>
  );
};
