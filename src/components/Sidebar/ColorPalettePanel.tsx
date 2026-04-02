import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { useEditorStore } from '../../store/editorStore';
import { useTranslation } from 'react-i18next';
import { IconRegistry } from '../IconRegistry';
import { IconButton, SectionHeader, InlineEditInput, useInlineEdit } from '../ui';

export const ColorPalettePanel: React.FC = () => {
  const { t } = useTranslation();
  const project = useProjectStore(s => s.project);
  const addPalette = useProjectStore(s => s.addPalette);
  const removePalette = useProjectStore(s => s.removePalette);
  const updatePalette = useProjectStore(s => s.updatePalette);
  const addColorToPalette = useProjectStore(s => s.addColorToPalette);
  const removeColorFromPalette = useProjectStore(s => s.removeColorFromPalette);
  const primaryColor = useEditorStore(s => s.primaryColor);
  const setPrimaryColor = useEditorStore(s => s.setPrimaryColor);
  const setSecondaryColor = useEditorStore(s => s.setSecondaryColor);

  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const inlineEdit = useInlineEdit();
  const palettes = project?.palettes ?? [];
  const activePalette = palettes.find(p => p.id === activePaletteId) ?? palettes[0] ?? null;

  // Auto-select first palette
  if (activePalette && activePaletteId !== activePalette.id) {
    setActivePaletteId(activePalette.id);
  }

  const handleAddPalette = () => {
    const id = crypto.randomUUID();
    addPalette({ id, name: `Palette ${palettes.length + 1}`, colors: [] });
    setActivePaletteId(id);
  };

  const handleDeletePalette = () => {
    if (!activePalette) return;
    removePalette(activePalette.id);
    setActivePaletteId(null);
  };

  const handleAddColor = () => {
    if (!activePalette) return;
    addColorToPalette(activePalette.id, primaryColor);
  };

  const handleColorClick = (color: string, e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      setSecondaryColor(color);
    } else {
      setPrimaryColor(color);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (!activePalette) return;
    removeColorFromPalette(activePalette.id, index);
  };

  const handleRenameSave = (newName: string) => {
    if (activePalette && newName.trim()) {
      updatePalette(activePalette.id, { name: newName.trim() });
    }
    inlineEdit.stopEditing();
  };

  return (
    <div className="border-b border-slate-700">
      <SectionHeader
        title={t('palette.title')}
        actions={
          <div className="flex gap-1">
            <IconButton icon={IconRegistry.Add} size="sm" onClick={handleAddPalette} label={t('palette.new_palette')} />
            <IconButton icon={IconRegistry.Delete} size="sm" variant="danger" onClick={handleDeletePalette} disabled={!activePalette} label={t('palette.delete_palette')} />
          </div>
        }
      />

      {palettes.length > 1 && (
        <div className="px-2 pb-1">
          <select
            className="w-full bg-slate-700 text-slate-300 text-xs rounded px-1.5 py-1 border border-slate-600"
            value={activePalette?.id ?? ''}
            onChange={(e) => setActivePaletteId(e.target.value)}
          >
            {palettes.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {activePalette && (
        <>
          {/* Palette name (click to rename) */}
          <div className="px-2 pb-1">
            {inlineEdit.isEditing(activePalette.id) ? (
              <InlineEditInput
                value={activePalette.name}
                onSave={handleRenameSave}
                onCancel={() => inlineEdit.stopEditing()}
                className="text-xs text-slate-300"
              />
            ) : (
              <span
                className="text-xs text-slate-300 cursor-pointer hover:text-white"
                onDoubleClick={() => inlineEdit.startEditing(activePalette.id)}
                title={t('palette.rename_tooltip')}
              >
                {activePalette.name}
              </span>
            )}
          </div>

          {/* Color swatches */}
          <div className="px-2 pb-2">
            <div className="flex flex-wrap gap-1">
              {activePalette.colors.map((color, idx) => (
                <div
                  key={`${color}-${idx}`}
                  className="relative group"
                >
                  <div
                    className="w-5 h-5 rounded-sm border border-slate-600 cursor-pointer hover:border-white hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={(e) => handleColorClick(color, e)}
                    onContextMenu={(e) => { e.preventDefault(); handleColorClick(color, e); }}
                    title={t('palette.color_tooltip', { defaultValue: `${color} — Click: primary, Right-click: secondary` })}
                  />
                  <button
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 text-white text-[8px] rounded-full hidden group-hover:flex items-center justify-center leading-none"
                    onClick={() => handleRemoveColor(idx)}
                    title={t('palette.remove_color')}
                  >×</button>
                </div>
              ))}

              {/* Add current color button */}
              <div
                className="w-5 h-5 rounded-sm border border-dashed border-slate-500 cursor-pointer hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-300 text-xs"
                onClick={handleAddColor}
                title={t('palette.add_color')}
              >+</div>
            </div>
          </div>
        </>
      )}

      {palettes.length === 0 && (
        <div className="px-2 pb-2 text-xs text-slate-500 italic">
          {t('palette.empty')}
        </div>
      )}
    </div>
  );
};
