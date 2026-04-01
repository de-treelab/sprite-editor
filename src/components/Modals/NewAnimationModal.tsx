import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generate_id } from '../../utils/id';
import { useProjectStore } from '../../store/projectStore';
import { Modal, ModalFooter, FormField, TextInput, NumberInput } from '../ui';

interface Props {
  spritesheetId: string;
  onClose: () => void;
}

export const NewAnimationModal: React.FC<Props> = ({ spritesheetId, onClose }) => {
  const { t } = useTranslation();
  const project = useProjectStore(state => state.project);
  const addAnimation = useProjectStore(state => state.addAnimation);
  const addFrame = useProjectStore(state => state.addFrame);
  const setActiveAnimation = useProjectStore(state => state.setActiveAnimation);
  const setActiveFrame = useProjectStore(state => state.setActiveFrame);
  const setActiveLayer = useProjectStore(state => state.setActiveLayer);

  const [name, setName] = useState('New Animation');
  const [width, setWidth] = useState(project?.defaultCanvasSize.width || 64);
  const [height, setHeight] = useState(project?.defaultCanvasSize.height || 64);

  const handleCreate = () => {
    const id = generate_id();
    const layerId = generate_id();
    const frameId = generate_id();
    const keyframeId = generate_id();

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
    addFrame(spritesheetId, initialFrame);
    setActiveAnimation(id);
    setActiveFrame(frameId);
    setActiveLayer(layerId);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('modal.new_anim.title', 'Create Animation')}
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
      <FormField label={t('modal.new_anim.name', 'Animation Name')}>
        <TextInput
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </FormField>

      <div className="flex space-x-4">
        <FormField label={t('modal.new_anim.width', 'Width')} className="flex-1">
          <NumberInput
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
          />
        </FormField>
        <FormField label={t('modal.new_anim.height', 'Height')} className="flex-1">
          <NumberInput
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
          />
        </FormField>
      </div>
    </Modal>
  );
};
