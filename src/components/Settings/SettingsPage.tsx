import React, { useState, useMemo } from 'react';
import { allSettings } from '../../config/settingsRegistry';
import { buildCategoryTree } from '../../config/settings';
import { useSettingsStore } from '../../store/settingsStore';
import { SettingEditor } from './SettingEditor';
import { SettingsCategorySidebar } from './SettingsCategorySidebar';
import { IconRegistry } from '../IconRegistry';

// --- Main Settings Page ---
export const SettingsPage: React.FC = () => {
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const resetAll = useSettingsStore((s) => s.resetAll);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryTree = useMemo(() => buildCategoryTree(allSettings), []);

  // Select first category by default
  const effectiveCategory = selectedCategory ?? (categoryTree.length > 0 ? categoryTree[0].id : null);

  const filteredSettings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allSettings.filter((s) => {
      // Category filter: show settings in selected category or its descendants
      const categoryMatch = !effectiveCategory || s.category === effectiveCategory || s.category.startsWith(effectiveCategory + '.');
      if (!categoryMatch) return false;

      // Search filter
      if (!query) return true;
      return (
        s.id.toLowerCase().includes(query) ||
        s.label.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query) ||
        (s.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [searchQuery, effectiveCategory]);

  // Group filtered settings by immediate category
  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filteredSettings>();
    for (const s of filteredSettings) {
      const list = groups.get(s.category) || [];
      list.push(s);
      groups.set(s.category, list);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredSettings]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800">
        <h1 className="text-lg font-semibold text-slate-200">Settings</h1>
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-slate-400 hover:text-red-400 px-3 py-1 rounded hover:bg-slate-700 transition-colors"
            onClick={resetAll}
          >
            Reset All
          </button>
          <button
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700 transition-colors"
            onClick={closeSettings}
            title="Close Settings"
          >
            <IconRegistry.Close className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <SettingsCategorySidebar
          categoryTree={categoryTree}
          selectedCategory={effectiveCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Right body */}
        <div className="flex-1 overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              No settings match your search.
            </div>
          ) : (
            grouped.map(([category, settings]) => (
              <div key={category}>
                <div className="sticky top-0 z-10 bg-slate-800/90 backdrop-blur px-4 py-2 border-b border-slate-700">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {category.split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' › ')}
                  </span>
                </div>
                {settings.map((s) => (
                  <SettingEditor key={s.id} definition={s} />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
