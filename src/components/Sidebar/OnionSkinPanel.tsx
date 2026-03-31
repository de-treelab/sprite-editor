import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { SectionPanel, SectionHeader, RangeSlider } from '../ui';

export const OnionSkinPanel: React.FC = () => {
  const {
    onionSkinEnabled, setOnionSkinEnabled,
    onionSkinBefore, setOnionSkinBefore,
    onionSkinAfter, setOnionSkinAfter,
    onionSkinOpacity, setOnionSkinOpacity,
    onionSkinBeforeTint, setOnionSkinBeforeTint,
    onionSkinAfterTint, setOnionSkinAfterTint,
  } = useEditorStore();

  return (
    <SectionPanel>
      <SectionHeader
        title="Onion Skin"
        toggle={{ checked: onionSkinEnabled, onChange: setOnionSkinEnabled }}
        className="mb-2"
      />
      {onionSkinEnabled && (
        <div className="space-y-2 mt-3">
          <RangeSlider
            label="Before"
            value={onionSkinBefore}
            onChange={setOnionSkinBefore}
            min={0}
            max={5}
            step={1}
          />
          <RangeSlider
            label="After"
            value={onionSkinAfter}
            onChange={setOnionSkinAfter}
            min={0}
            max={5}
            step={1}
          />
          <RangeSlider
            label="Opacity"
            value={onionSkinOpacity}
            onChange={setOnionSkinOpacity}
            min={0.1}
            max={1.0}
            step={0.1}
            valueFormatter={(v) => v.toFixed(1)}
          />
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Before</span>
              <input
                type="color"
                value={onionSkinBeforeTint}
                onChange={(e) => setOnionSkinBeforeTint(e.target.value)}
                className="w-6 h-6 rounded border border-slate-600 cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>After</span>
              <input
                type="color"
                value={onionSkinAfterTint}
                onChange={(e) => setOnionSkinAfterTint(e.target.value)}
                className="w-6 h-6 rounded border border-slate-600 cursor-pointer bg-transparent"
              />
            </label>
          </div>
        </div>
      )}
    </SectionPanel>
  );
};
