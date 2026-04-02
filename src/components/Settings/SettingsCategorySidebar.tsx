import React, { useState } from 'react';
import { CategoryNode } from '../../config/settings';
import { TextInput } from '../ui';

const CategoryItem: React.FC<{
  node: CategoryNode;
  depth: number;
  selectedCategory: string | null;
  onSelect: (id: string) => void;
}> = ({ node, depth, selectedCategory, onSelect }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedCategory === node.id;
  const isAncestor = selectedCategory?.startsWith(node.id + '.') ?? false;

  return (
    <div>
      <button
        className={`
          w-full text-left px-3 py-1.5 text-sm flex items-center gap-1 transition-colors rounded-sm
          ${isSelected ? 'bg-indigo-600/20 text-indigo-300 font-medium' : isAncestor ? 'text-slate-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}
        `}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={() => {
          onSelect(node.id);
          if (node.children.length > 0) setExpanded(!expanded);
        }}
      >
        {node.children.length > 0 && (
          <span className={`text-[10px] transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        )}
        <span className="capitalize">{node.label}</span>
      </button>
      {expanded &&
        node.children.map((child) => (
          <CategoryItem
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedCategory={selectedCategory}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
};

interface SettingsCategorySidebarProps {
  categoryTree: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SettingsCategorySidebar: React.FC<SettingsCategorySidebarProps> = ({
  categoryTree,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-700 flex flex-col bg-slate-850">
      <div className="p-3 border-b border-slate-700">
        <TextInput
          size="sm"
          placeholder="Search settings…"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {categoryTree.map((node) => (
          <CategoryItem
            key={node.id}
            node={node}
            depth={0}
            selectedCategory={selectedCategory}
            onSelect={onSelectCategory}
          />
        ))}
      </div>
    </div>
  );
};
