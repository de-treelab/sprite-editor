import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { SectionPanel, SectionHeader, RangeSlider } from '../ui';
import { useTranslation } from 'react-i18next';

export const OnionSkinPanel: React.FC = () => {
  const {
    onionSkinEnabled,
    setOnionSkinEnabled,
    onionSkinBefore,
    setOnionSkinBefore,
    onionSkinAfter,
    setOnionSkinAfter,
    onionSkinOpacity,
    setOnionSkinOpacity,
    onionSkinBeforeTint,
    setOnionSkinBeforeTint,
    onionSkinAfterTint,
    setOnionSkinAfterTint,
  } = useEditorStore();
  const { t } = useTranslation();

  return (
    <SectionPanel>
      <SectionHeader
        title={t('onion_skin.title')}
        toggle={{ checked: onionSkinEnabled, onChange: setOnionSkinEnabled }}
        className="mb-2"
      />
      {onionSkinEnabled && (
        <div className="space-y-2 mt-3">
          <RangeSlider
            label={t('onion_skin.before')}
            value={onionSkinBefore}
            onChange={setOnionSkinBefore}
            min={0}
            max={5}
            step={1}
          />
          <RangeSlider
            label={t('onion_skin.after')}
            value={onionSkinAfter}
            onChange={setOnionSkinAfter}
            min={0}
            max={5}
            step={1}
          />
          <RangeSlider
            label={t('onion_skin.opacity')}
            value={onionSkinOpacity}
            onChange={setOnionSkinOpacity}
            min={0.1}
            max={1.0}
            step={0.1}
            valueFormatter={(v) => v.toFixed(1)}
          />
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{t('onion_skin.before')}</span>
              <input
                type="color"
                value={onionSkinBeforeTint}
                onChange={(e) => setOnionSkinBeforeTint(e.target.value)}
                className="w-6 h-6 rounded border border-slate-600 cursor-pointer bg-transparent"
              />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>{t('onion_skin.after')}</span>
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
