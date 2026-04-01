import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generate_id } from '../../utils/id';
import { useProjectStore } from '../../store/projectStore';
import { Modal, ModalFooter, FormField, TextInput, NumberInput, TabGroup } from '../ui';

type ItemTab = 'animation' | 'image';

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
  const [name, setName] = useState(initialTab === 'image' ? 'New Image' : 'New Animation');
  const [width, setWidth] = useState(project?.defaultCanvasSize.width || 64);
  const [height, setHeight] = useState(project?.defaultCanvasSize.height || 64);

  const tabs = [
    { id: 'animation' as const, label: t('modal.new_item.tab_animation', 'Animation') },
    { id: 'image' as const, label: t('modal.new_item.tab_image', 'Image') },
  ];

  const handleTabChange = (tab: ItemTab) => {
    setActiveTab(tab);
    if (tab === 'image' && name === 'New Animation') {
      setName('New Image');
    } else if (tab === 'animation' && name === 'New Image') {
      setName('New Animation');
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
      data: ''
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

  const nameLabel = activeTab === 'image'
    ? t('modal.new_item.image_name', 'Image Name')
    : t('modal.new_item.anim_name', 'Animation Name');

  const title = activeTab === 'image'
    ? t('modal.new_item.title_image', 'Create Image')
    : t('modal.new_item.title_animation', 'Create Animation');

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
          confirmText={t('common.create', 'Create')}
          confirmDisabled={!name || width <= 0 || height <= 0}
        />
      }
    >
      <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} className="mb-4" />

      <FormField label={nameLabel}>
        <TextInput
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </FormField>

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
    </Modal>
  );
};
