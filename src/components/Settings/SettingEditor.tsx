import React from 'react';
import { SettingDefinition } from '../../config/settings';
import { useSettingsStore } from '../../store/settingsStore';
import { TextInput, NumberInput, Toggle, Select } from '../ui';
import { KeybindingInput } from './KeybindingInput';

interface SettingEditorProps {
  definition: SettingDefinition;
}

export const SettingEditor: React.FC<SettingEditorProps> = ({ definition }) => {
  const value = useSettingsStore((s) => s.values[definition.id] ?? definition.default);
  const setValue = useSettingsStore((s) => s.setValue);
  const resetValue = useSettingsStore((s) => s.resetValue);
  const isDefault = value === definition.default;

  const renderControl = () => {
    switch (definition.type) {
      case 'string':
      case 'path':
        return (
          <TextInput
            size="sm"
            value={String(value)}
            onChange={(e) => setValue(definition.id, e.target.value)}
            className="max-w-xs"
          />
        );

      case 'number':
        return (
          <NumberInput
            size="sm"
            value={Number(value)}
            min={definition.min}
            max={definition.max}
            step={definition.step}
            onChange={(e) => setValue(definition.id, Number(e.target.value))}
            className="max-w-[120px]"
          />
        );

      case 'boolean':
        return (
          <Toggle
            checked={Boolean(value)}
            onChange={(checked) => setValue(definition.id, checked)}
          />
        );

      case 'keybinding':
        return (
          <KeybindingInput
            value={String(value)}
            onChange={(v) => setValue(definition.id, v)}
            onReset={() => resetValue(definition.id)}
            isDefault={isDefault}
          />
        );

      case 'select':
        return (
          <Select
            size="sm"
            value={String(value)}
            onChange={(e) => setValue(definition.id, e.target.value)}
            options={definition.options}
            className="max-w-xs"
          />
        );

      default:
        return <span className="text-slate-500 text-xs">Unsupported type</span>;
    }
  };

  return (
    <div className="py-3 px-4 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">{definition.label}</span>
            {!isDefault && (
              <span className="text-[10px] bg-indigo-600/30 text-indigo-300 px-1.5 py-0.5 rounded">Modified</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">{definition.id}</div>
          {definition.description && (
            <div className="text-xs text-slate-400 mt-1">{definition.description}</div>
          )}
        </div>
        <div className="flex-shrink-0">{renderControl()}</div>
      </div>
    </div>
  );
};
