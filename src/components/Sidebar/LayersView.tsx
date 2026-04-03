import { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useNavigatorCommands } from '../../hooks/useNavigatorCommands';
import { useHistoryStore } from '../../store/historyStore';
import { IconRegistry } from '../IconRegistry';
import { useTranslation } from 'react-i18next';
import { LayerListItem } from './LayerListItem';
import { IconButton } from '../ui';
import { getCanvasActions } from '../../hooks/canvasActions';

/** Standalone Layers panel view for the layout system */
export const RightSidebarLayers = () => {
  const { t } = useTranslation();
  const project = useProjectStore((state) => state.project);
  const activeSpritesheetId = useProjectStore((state) => state.activeSpritesheetId);
  const activeFrameId = useProjectStore((state) => state.activeFrameId);
  const activeSheet = project?.spritesheets?.find((s) => s.id === activeSpritesheetId);
  const activeLayerId = useProjectStore((state) => state.activeLayerId);
  const setActiveLayer = useProjectStore((state) => state.setActiveLayer);
  const addLayer = useProjectStore((state) => state.addLayer);
  const removeLayer = useProjectStore((state) => state.removeLayer);
  const reorderLayers = useProjectStore((state) => state.reorderLayers);

  const activeFrame = activeSheet?.frames.find((f) => f.id === activeFrameId);
  const layers = activeFrame?.layers || [];

  const [draggedLayerIndex, setDraggedLayerIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (layers.length > 0) {
      if (!activeLayerId || !layers.some((l) => l.id === activeLayerId)) {
        setActiveLayer(layers[0].id);
      }
    } else {
      if (activeLayerId) setActiveLayer(null);
    }
  }, [layers, activeLayerId, setActiveLayer]);

  const handleAddLayer = () => {
    if (!activeSpritesheetId || !activeFrameId) return;
    const sheetId = activeSpritesheetId;
    const frameId = activeFrameId;
    const newLayer = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      opacity: 1.0,
      blendMode: 'normal' as const,
      visible: true,
      locked: false,
      isReference: false,
      data: '',
    };
    addLayer(sheetId, frameId, newLayer);
    setActiveLayer(newLayer.id);

    useHistoryStore.getState().push({
      label: 'Add layer',
      undo: () => {
        useProjectStore.getState().removeLayer(sheetId, frameId, newLayer.id);
      },
      redo: () => {
        useProjectStore.getState().addLayer(sheetId, frameId, newLayer);
        useProjectStore.getState().setActiveLayer(newLayer.id);
      },
    });
  };

  const handleRemoveLayer = () => {
    if (!activeSpritesheetId || !activeFrameId || !activeLayerId) return;
    const sheetId = activeSpritesheetId;
    const frameId = activeFrameId;
    const layerId = activeLayerId;

    const removedLayer = layers.find((l) => l.id === layerId);
    const removedIndex = layers.findIndex((l) => l.id === layerId);
    if (!removedLayer) return;
    const layerSnapshot = { ...removedLayer };

    removeLayer(sheetId, frameId, layerId);
    if (layers.length > 1) {
      const remaining = layers.filter((l) => l.id !== layerId);
      setActiveLayer(remaining[0].id);
    } else {
      setActiveLayer(null);
    }

    useHistoryStore.getState().push({
      label: 'Delete layer',
      undo: () => {
        const ps = useProjectStore.getState();
        ps.addLayer(sheetId, frameId, layerSnapshot);
        const sheet = ps.project?.spritesheets.find((s) => s.id === sheetId);
        const frame = sheet?.frames.find((f) => f.id === frameId);
        if (frame) {
          const currentIndex = frame.layers.length - 1;
          if (currentIndex !== removedIndex) {
            ps.reorderLayers(sheetId, frameId, currentIndex, removedIndex);
          }
        }
        ps.setActiveLayer(layerSnapshot.id);
      },
      redo: () => {
        useProjectStore.getState().removeLayer(sheetId, frameId, layerId);
      },
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedLayerIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedLayerIndex !== null && draggedLayerIndex !== dropIndex && activeSpritesheetId && activeFrameId) {
      const sheetId = activeSpritesheetId;
      const frameId = activeFrameId;
      const fromIndex = draggedLayerIndex;
      const toIndex = dropIndex;
      reorderLayers(sheetId, frameId, fromIndex, toIndex);

      useHistoryStore.getState().push({
        label: 'Reorder layers',
        undo: () => useProjectStore.getState().reorderLayers(sheetId, frameId, toIndex, fromIndex),
        redo: () => useProjectStore.getState().reorderLayers(sheetId, frameId, fromIndex, toIndex),
      });
    }
    setDraggedLayerIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerIndex(null);
    setDragOverIndex(null);
  };

  useNavigatorCommands({
    onNewLayer: handleAddLayer,
    onDeleteLayer: handleRemoveLayer,
  });

  const handleMergeDown = () => {
    const actions = getCanvasActions();
    if (actions) {
      actions.mergeDown();
    }
  };

  const canMergeDown = (() => {
    if (!activeLayerId || layers.length < 2) return false;
    const idx = layers.findIndex((l) => l.id === activeLayerId);
    return idx > 0;
  })();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Layers Header */}
      <div className="p-2 border-b border-slate-700 font-bold text-sm text-slate-300 flex justify-between items-center shrink-0">
        <span>{t('sidebar.layers', 'Layers')}</span>
        <div className="flex gap-1">
          <IconButton icon={IconRegistry.Add} size="sm" onClick={handleAddLayer} label={t('sidebar.new_layer')} />
          <IconButton
            icon={IconRegistry.Merge}
            size="sm"
            onClick={handleMergeDown}
            disabled={!canMergeDown}
            label={t('sidebar.merge_down')}
          />
          <IconButton
            icon={IconRegistry.Delete}
            size="sm"
            variant="danger"
            onClick={handleRemoveLayer}
            disabled={!activeLayerId}
            label={t('sidebar.delete_layer')}
          />
        </div>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...layers].reverse().map((layer, reverseIndex) => {
          const index = layers.length - 1 - reverseIndex;
          return (
            <LayerListItem
              key={layer.id}
              layer={layer}
              index={index}
              isActive={activeLayerId === layer.id}
              isDragging={draggedLayerIndex === index}
              isDragOver={dragOverIndex === index}
              onSelect={() => setActiveLayer(layer.id)}
              onRemove={handleRemoveLayer}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          );
        })}
      </div>
    </div>
  );
};
