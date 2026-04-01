import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { generate_id } from '../../utils/id';
import { useProjectStore } from '../../store/projectStore';
import { importImage } from '../../services/backend';
import { Modal, ModalFooter, FormField, TextInput, NumberInput, TabGroup } from '../ui';

type ItemTab = 'animation' | 'image' | 'import';

interface Props {
  spritesheetId: string;
  initialTab?: ItemTab;
  onClose: () => void;
}

export const NewItemModal: React.FC<Props> = ({ spritesheetId, initialTab = 'animation', onClose }) => {
  const { t } = useTranslation();
  const project = useProjectStore(state => state.project);
  const addAnimation = useProjectStore(state => state.addAnimation);
  const addImage = useProjectStore(state => state.addImage);
  const addFrame = useProjectStore(state => state.addFrame);
  const setActiveItem = useProjectStore(state => state.setActiveItem);
  const setActiveFrame = useProjectStore(state => state.setActiveFrame);
  const setActiveLayer = useProjectStore(state => state.setActiveLayer);

  const [activeTab, setActiveTab] = useState<ItemTab>(initialTab);
  const [name, setName] = useState(initialTab === 'image' ? 'New Image' : initialTab === 'import' ? '' : 'New Animation');
  const [width, setWidth] = useState(project?.defaultCanvasSize.width || 64);
  const [height, setHeight] = useState(project?.defaultCanvasSize.height || 64);
  const [importPath, setImportPath] = useState<string | null>(null);
  const [importDataUrl, setImportDataUrl] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const tabs = [
    { id: 'animation' as const, label: t('modal.new_item.tab_animation', 'Animation') },
    { id: 'image' as const, label: t('modal.new_item.tab_image', 'Image') },
    { id: 'import' as const, label: t('modal.new_item.tab_import', 'Import') },
  ];

  const handleTabChange = (tab: ItemTab) => {
    setActiveTab(tab);
    if (tab === 'animation') {
      if (name === 'New Image' || name === '') setName('New Animation');
    } else if (tab === 'image') {
      if (name === 'New Animation' || name === '') setName('New Image');
    } else if (tab === 'import') {
      if (name === 'New Animation' || name === 'New Image') setName('');
    }
  };

  const handleBrowse = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp', 'gif'] }],
    });
    if (!file) return;
    setImportPath(file);
    setImporting(true);
    try {
      const result = await importImage(file);
      setImportDataUrl(result.data_url);
      setWidth(result.width);
      setHeight(result.height);
      // Derive a default name from the filename
      const filename = file.split(/[/\\]/).pop() || '';
      const baseName = filename.replace(/\.[^.]+$/, '');
      if (!name) setName(baseName);
    } catch (err) {
      console.error('Failed to import image:', err);
      setImportPath(null);
    } finally {
      setImporting(false);
    }
  };

  const handleCreate = () => {
    const id = generate_id();
    const layerId = generate_id();
    const frameId = generate_id();

    const initialLayer = {
      id: layerId,
      name: 'Background',
      opacity: 1.0,
      blendMode: 'normal' as const,
      visible: true,
      locked: false,
      isReference: false,
      data: activeTab === 'import' && importDataUrl ? importDataUrl : ''
    };

    const initialFrame = {
      id: frameId,
      layers: [initialLayer]
    };

    addFrame(spritesheetId, initialFrame);

    if (activeTab === 'animation') {
      const keyframeId = generate_id();
      const initialKeyframe = {
        id: keyframeId,
        time: 0,
        frameId: frameId
      };

      addAnimation(spritesheetId, {
        id,
        name,
        canvasSize: { width, height },
        keyframes: [initialKeyframe]
      });
      setActiveItem(id, 'animation');
    } else {
      addImage(spritesheetId, {
        id,
        name,
        canvasSize: { width, height },
        frameId,
      });
      setActiveItem(id, 'image');
    }

    setActiveFrame(frameId);
    setActiveLayer(layerId);
    onClose();
  };

  const nameLabel = activeTab === 'image' || activeTab === 'import'
    ? t('modal.new_item.image_name', 'Image Name')
    : t('modal.new_item.anim_name', 'Animation Name');

  const title = activeTab === 'import'
    ? t('modal.new_item.title_import', 'Import Image')
    : activeTab === 'image'
      ? t('modal.new_item.title_image', 'Create Image')
      : t('modal.new_item.title_animation', 'Create Animation');

  const isImportReady = activeTab !== 'import' || (importDataUrl != null && !importing);
  const confirmDisabled = !name || width <= 0 || height <= 0 || !isImportReady;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleCreate}
          cancelText={t('common.cancel', 'Cancel')}
          confirmText={activeTab === 'import' ? t('common.import', 'Import') : t('common.create', 'Create')}
          confirmDisabled={confirmDisabled}
        />
      }
    >
      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} className="mb-4" />

      {activeTab === 'import' && (
        <FormField label={t('modal.new_item.file', 'File')}>
          <button
            type="button"
            onClick={handleBrowse}
            className="w-full px-3 py-2 text-left text-sm rounded border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 truncate"
          >
            {importing
              ? t('modal.new_item.importing', 'Loading…')
              : importPath
                ? importPath.split(/[/\\]/).pop()
                : t('modal.new_item.browse', 'Browse…')}
          </button>
        </FormField>
      )}

      <FormField label={nameLabel}>
        <TextInput
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </FormField>

      {activeTab !== 'import' && (
        <div className="flex space-x-4">
          <FormField label={t('modal.new_item.width', 'Width')} className="flex-1">
            <NumberInput
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
            />
          </FormField>
          <FormField label={t('modal.new_item.height', 'Height')} className="flex-1">
            <NumberInput
              value={height}
              onChange={e => setHeight(Number(e.target.value))}
            />
          </FormField>
        </div>
      )}

      {activeTab === 'import' && importDataUrl && (
        <div className="mt-2 text-xs text-zinc-400">
          {width} × {height} px
        </div>
      )}
    </Modal>
  );
};
