import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generate_id } from '../../utils/id';
import { useProjectStore } from '../../store/projectStore';
import { Modal, ModalFooter, FormField, TextInput } from '../ui';

export const NewSpritesheetModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();
  const addSpritesheet = useProjectStore(state => state.addSpritesheet);
  const setActiveSpritesheet = useProjectStore(state => state.setActiveSpritesheet);

  const [name, setName] = useState(t('new_spritesheet.default_name'));

  const handleCreate = () => {
    const id = generate_id();
    addSpritesheet({
      id,
      name,
      animations: [],
      images: [],
      frames: []
    });
    setActiveSpritesheet(id);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('modal.new_spritesheet.title', 'Create Spritesheet')}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleCreate}
          cancelText={t('common.cancel', 'Cancel')}
          confirmText={t('common.create', 'Create')}
          confirmDisabled={!name}
        />
      }
    >
      <FormField label={t('modal.new_spritesheet.name', 'Spritesheet Name')}>
        <TextInput
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </FormField>
    </Modal>
  );
};
