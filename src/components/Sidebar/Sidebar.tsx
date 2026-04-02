import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { getCategories, getToolsByCategory, onRegistryChange } from '../../tools/toolRegistry';
import { useTranslation } from 'react-i18next';
import { IconButton, ToolbarDivider } from '../ui';
import { IconRegistry } from '../IconRegistry';

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { activeTool, setActiveTool, primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } =
    useEditorStore();

  // Re-render when tools are registered/unregistered
  const [categories, setCategories] = useState(getCategories);
  useEffect(() => {
    const update = () => setCategories(getCategories());
    return onRegistryChange(update);
  }, []);

  const handleColorSwap = (e: React.MouseEvent) => {
    e.preventDefault();
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  return (
    <div className="bg-slate-800 flex flex-col items-center py-2 overflow-y-auto flex-1 min-w-0">
      {categories.map((category, catIndex) => (
        <React.Fragment key={category}>
          {catIndex > 0 && <ToolbarDivider />}
          <div className="flex flex-row flex-wrap items-center space-y-1">
            {getToolsByCategory(category).map((tool) => (
              <IconButton
                key={tool.id}
                icon={tool.icon}
                size="lg"
                variant="active"
                isActive={activeTool === tool.id}
                label={t(tool.labelKey, tool.defaultLabel)}
                onClick={() => setActiveTool(tool.id)}
              />
            ))}
          </div>
        </React.Fragment>
      ))}

      <div className="flex-1" />

      {/* Color Picker */}
      <div className="relative w-10 h-12 mb-2">
        <div className="relative w-10 h-10">
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => {
              e.stopPropagation();
              setSecondaryColor(e.target.value);
            }}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-pointer rounded-sm border border-slate-600 outline-none"
            title={t('sidebar.colors.secondary', 'Secondary Color')}
          />
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => {
              e.stopPropagation();
              setPrimaryColor(e.target.value);
            }}
            className="absolute top-0 left-0 w-6 h-6 cursor-pointer rounded-sm border border-slate-600 outline-none z-10"
            title={t('sidebar.colors.primary', 'Primary Color')}
          />
        </div>
        <button
          className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-white bg-slate-700 rounded-sm border border-slate-600 z-20"
          onClick={handleColorSwap}
          title={t('sidebar.colors.swap', 'Swap Colors (X)')}
        >
          <IconRegistry.SwapColors size={10} />
        </button>
      </div>
    </div>
  );
};
