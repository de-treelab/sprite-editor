import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Modal, ModalFooter, FormField, NumberInput, Select } from '../ui';
import { toast } from 'react-toastify';
import { save } from '@tauri-apps/plugin-dialog';
import {
  packAtlas,
  buildAnimationExportData,
  buildAtlasMetadata,
  saveAtlasPng,
  saveMetadataFile,
  exportAnimationGif,
} from '../../services/exportService';
import { builtinPlugins, runPythonPlugin } from '../../services/exportPlugins';
import { open } from '@tauri-apps/plugin-dialog';
import { useTranslation } from 'react-i18next';

type ExportFormat = 'atlas' | 'gif' | 'metadata';

interface Props {
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const project = useProjectStore(s => s.project);
  const activeSpritesheetId = useProjectStore(s => s.activeSpritesheetId);
  const activeItemId = useProjectStore(s => s.activeItemId);

  const [format, setFormat] = useState<ExportFormat>('atlas');
  const [atlasMaxWidth, setAtlasMaxWidth] = useState(4096);
  const [atlasMaxHeight, setAtlasMaxHeight] = useState(4096);
  const [atlasPadding, setAtlasPadding] = useState(1);
  const [scale, setScale] = useState(1);
  const [metadataPlugin, setMetadataPlugin] = useState('generic-json');
  const [pythonScriptPath, setPythonScriptPath] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!project) return null;

  const activeSheet = project.spritesheets.find(s => s.id === activeSpritesheetId);
  const activeAnimation = activeSheet?.animations.find(a => a.id === activeItemId);

  const formatOptions = [
    { value: 'atlas', label: t('export_modal.format_atlas') },
    { value: 'gif', label: t('export_modal.format_gif') },
    { value: 'metadata', label: t('export_modal.format_metadata') },
  ];

  const pluginOptions = [
    ...builtinPlugins.map(p => ({ value: p.id, label: p.name })),
    { value: 'python', label: t('export_modal.format_custom_script') },
  ];

  const handleBrowsePythonScript = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Python Scripts', extensions: ['py'] }],
    });
    if (file) {
      setPythonScriptPath(file as string);
    }
  };

  const handleExport = async () => {
    if (!activeSheet) {
      toast.error(t('export_modal.error_no_spritesheet'));
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'atlas') {
        await handleExportAtlas();
      } else if (format === 'gif') {
        await handleExportGif();
      } else if (format === 'metadata') {
        await handleExportMetadata();
      }
      onClose();
    } catch (e) {
      console.error('Export error:', e);
      toast.error(`Export failed: ${e}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAtlas = async () => {
    if (!activeSheet) return;

    // Pack atlas
    const atlas = await packAtlas(project, activeSheet, {
      maxWidth: atlasMaxWidth,
      maxHeight: atlasMaxHeight,
      padding: atlasPadding,
      scale,
    });

    // Ask for save location
    const pngPath = await save({
      defaultPath: `${activeSheet.name}_atlas.png`,
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
    });
    if (!pngPath) return;

    // Save PNG
    await saveAtlasPng(pngPath, atlas);

    // Also save metadata alongside
    const animData = buildAnimationExportData(activeSheet.animations, project.defaultCanvasSize);
    const metadata = buildAtlasMetadata(atlas, animData);

    const plugin = builtinPlugins.find(p => p.id === metadataPlugin) ?? builtinPlugins[0];
    const metaContent = plugin.generate(metadata);
    const metaPath = pngPath.replace(/\.png$/i, plugin.fileExtension);
    await saveMetadataFile(metaPath, metaContent);

    toast.success(`Atlas exported: ${atlas.rects.length} frames, ${atlas.atlasWidth}×${atlas.atlasHeight}px`);
  };

  const handleExportGif = async () => {
    if (!activeSheet || !activeAnimation) {
      toast.error(t('export_modal.error_no_animation'));
      return;
    }

    const gifPath = await save({
      defaultPath: `${activeAnimation.name}.gif`,
      filters: [{ name: 'GIF Image', extensions: ['gif'] }],
    });
    if (!gifPath) return;

    await exportAnimationGif(gifPath, project, activeSheet, activeAnimation, { scale });

    toast.success(`GIF exported: ${activeAnimation.name}`);
  };

  const handleExportMetadata = async () => {
    if (!activeSheet) return;

    // Pack atlas to get rects (but don't save the image)
    const atlas = await packAtlas(project, activeSheet, {
      maxWidth: atlasMaxWidth,
      maxHeight: atlasMaxHeight,
      padding: atlasPadding,
      scale,
    });

    const animData = buildAnimationExportData(activeSheet.animations, project.defaultCanvasSize);
    const metadata = buildAtlasMetadata(atlas, animData);

    let metaContent: string;
    let fileExtension: string;

    if (metadataPlugin === 'python') {
      if (!pythonScriptPath) {
        toast.error(t('export_modal.error_no_script'));
        return;
      }
      metaContent = await runPythonPlugin(pythonScriptPath, metadata);
      fileExtension = '.txt';
    } else {
      const plugin = builtinPlugins.find(p => p.id === metadataPlugin) ?? builtinPlugins[0];
      metaContent = plugin.generate(metadata);
      fileExtension = plugin.fileExtension;
    }

    const savePath = await save({
      defaultPath: `${activeSheet.name}_metadata${fileExtension}`,
    });
    if (!savePath) return;

    await saveMetadataFile(savePath, metaContent);
    toast.success(t('export_modal.success_metadata'));
  };

  const canExport = activeSheet && (format !== 'gif' || activeAnimation);

  return (
    <Modal isOpen={true} onClose={onClose} title={t('export_modal.title')} size="lg">
      <FormField label={t('export_modal.format')}>
        <Select
          options={formatOptions}
          value={format}
          onChange={(e) => setFormat(e.target.value as ExportFormat)}
        />
      </FormField>

      {/* Atlas options */}
      {(format === 'atlas' || format === 'metadata') && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('export_modal.max_width')}>
              <NumberInput value={atlasMaxWidth} onChange={(e) => setAtlasMaxWidth(Number(e.target.value))} min={64} max={8192} step={64} />
            </FormField>
            <FormField label={t('export_modal.max_height')}>
              <NumberInput value={atlasMaxHeight} onChange={(e) => setAtlasMaxHeight(Number(e.target.value))} min={64} max={8192} step={64} />
            </FormField>
          </div>
          <FormField label={t('export_modal.padding')}>
            <NumberInput value={atlasPadding} onChange={(e) => setAtlasPadding(Number(e.target.value))} min={0} max={16} />
          </FormField>
        </>
      )}

      <FormField label={t('common.scale')}>
        <NumberInput value={scale} onChange={(e) => setScale(Number(e.target.value))} min={0.25} max={4} step={0.25} />
      </FormField>

      {/* Metadata plugin selection */}
      {(format === 'atlas' || format === 'metadata') && (
        <FormField label={t('export_modal.metadata_format')}>
          <Select
            options={pluginOptions}
            value={metadataPlugin}
            onChange={(e) => setMetadataPlugin(e.target.value)}
          />
        </FormField>
      )}

      {/* Python script path */}
      {metadataPlugin === 'python' && (format === 'atlas' || format === 'metadata') && (
        <FormField label={t('export_modal.python_script')}>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={pythonScriptPath}
              placeholder={t('export_modal.no_script_selected')}
              className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-300"
            />
            <button
              onClick={handleBrowsePythonScript}
              className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded hover:bg-slate-600"
            >
              {t('common.browse')}
            </button>
          </div>
        </FormField>
      )}

      {/* GIF notice */}
      {format === 'gif' && !activeAnimation && (
        <p className="text-xs text-orange-400">
          {t('export_modal.gif_warning')}
        </p>
      )}

      {format === 'gif' && activeAnimation && (
        <p className="text-xs text-slate-400">
          Will export animation "{activeAnimation.name}" ({activeAnimation.keyframes.length} frames).
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleExport}
          confirmText={isExporting ? t('common.exporting') : t('common.export')}
          confirmDisabled={!canExport || isExporting}
        />
      </div>
    </Modal>
  );
};
