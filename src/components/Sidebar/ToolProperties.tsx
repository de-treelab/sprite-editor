import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { toolDefinitions, ToolProperty, NumberProperty, SelectProperty, BooleanProperty } from '../../tools/toolDefinitions';
import { useTranslation } from 'react-i18next';
import { RangeSlider, Select, Checkbox, SectionPanel, SectionHeader } from '../ui';

const NumberPropertyInput: React.FC<{
  property: NumberProperty;
  value: number;
  onChange: (value: number) => void;
}> = ({ property, value, onChange }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{property.label}</label>
      <RangeSlider
        value={value}
        onChange={onChange}
        min={property.min}
        max={property.max}
        step={property.step}
        showNumberInput
        showValue={false}
      />
    </div>
  );
};

const SelectPropertyInput: React.FC<{
  property: SelectProperty;
  value: string;
  onChange: (value: string) => void;
}> = ({ property, value, onChange }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400">{property.label}</label>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={property.options}
      />
    </div>
  );
};

const BooleanPropertyInput: React.FC<{
  property: BooleanProperty;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ property, value, onChange }) => {
  return (
    <Checkbox
      checked={value}
      onChange={onChange}
      label={property.label}
    />
  );
};

const PropertyEditor: React.FC<{
  property: ToolProperty;
  value: number | string | boolean;
  onChange: (value: number | string | boolean) => void;
}> = ({ property, value, onChange }) => {
  switch (property.type) {
    case 'number':
      return (
        <NumberPropertyInput
          property={property}
          value={value as number}
          onChange={onChange}
        />
      );
    case 'select':
      return (
        <SelectPropertyInput
          property={property}
          value={value as string}
          onChange={onChange}
        />
      );
    case 'boolean':
      return (
        <BooleanPropertyInput
          property={property}
          value={value as boolean}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
};

export const ToolProperties: React.FC = () => {
  const { t } = useTranslation();
  const { activeTool, toolProperties, setToolProperty } = useEditorStore();

  const toolDef = toolDefinitions[activeTool];
  if (!toolDef || toolDef.properties.length === 0) {
    return null;
  }

  const currentProps = toolProperties[activeTool] || {};

  return (
    <SectionPanel>
      <SectionHeader title={t(toolDef.labelKey, toolDef.defaultLabel)} className="mb-3" />
      <div className="flex flex-col gap-3">
        {toolDef.properties.map((property) => (
          <PropertyEditor
            key={property.key}
            property={property}
            value={currentProps[property.key] ?? property.default}
            onChange={(value) => setToolProperty(activeTool, property.key, value)}
          />
        ))}
      </div>
    </SectionPanel>
  );
};
