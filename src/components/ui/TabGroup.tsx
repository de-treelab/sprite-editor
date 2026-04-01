export interface Tab<T extends string = string> {
  id: T;
  label: string;
}

interface TabGroupProps<T extends string = string> {
  tabs: Tab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

export function TabGroup<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: TabGroupProps<T>) {
  return (
    <div className={`flex border-b border-slate-600 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-white border-b-2 border-indigo-400 -mb-px'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
