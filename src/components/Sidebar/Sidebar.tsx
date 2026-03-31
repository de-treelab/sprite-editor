import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { toolDefinitions, ToolId, ToolDefinition } from '../../tools/toolDefinitions';
import { useTranslation } from 'react-i18next';
import { IconButton, ToolbarDivider } from '../ui';

// Group tools by category for display
const toolCategories: { id: ToolDefinition['category']; tools: ToolId[] }[] = [
  { id: 'draw', tools: ['pencil', 'eraser', 'fill', 'line', 'rectangle', 'ellipse'] },
  { id: 'select', tools: ['selection', 'magicWand'] },
  { id: 'transform', tools: ['move', 'flipHorizontal', 'flipVertical'] },
  { id: 'utility', tools: ['picker'] },
];

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { activeTool, setActiveTool, primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor } = useEditorStore();

  const handleColorSwap = (e: React.MouseEvent) => {
    e.preventDefault();
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  };

  return (
    <div className="w-16 shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-2 overflow-y-auto">
      {toolCategories.map((category, catIndex) => (
        <React.Fragment key={category.id}>
          {catIndex > 0 && <ToolbarDivider />}
          <div className="flex flex-col items-center space-y-1">
            {category.tools.map((toolId) => {
              const tool = toolDefinitions[toolId];
              return (
                <IconButton
                  key={tool.id}
                  icon={tool.icon}
                  size="lg"
                  variant="active"
                  isActive={activeTool === toolId}
                  label={t(tool.labelKey, tool.defaultLabel)}
                  onClick={() => setActiveTool(toolId)}
                />
              );
            })}
          </div>
        </React.Fragment>
      ))}

      <div className="flex-1" />

      {/* Color Picker */}
      <div
        className="relative w-10 h-10 mb-2 cursor-pointer"
        onClick={handleColorSwap}
        onContextMenu={handleColorSwap}
        title={t('sidebar.colors.swap', 'Swap Colors (Click)')}
      >
        <input
          type="color"
          value={secondaryColor}
          onChange={(e) => {
            e.stopPropagation();
            setSecondaryColor(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
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
          onClick={(e) => e.stopPropagation()}
          className="absolute top-0 left-0 w-6 h-6 cursor-pointer rounded-sm border border-slate-600 outline-none z-10"
          title={t('sidebar.colors.primary', 'Primary Color')}
        />
      </div>
    </div>
  );
};
