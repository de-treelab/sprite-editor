import React, { useState } from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import { useProjectStore } from '../../store/projectStore';
import { Modal, ModalFooter, FormField, TextInput, Checkbox } from '../ui';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
}

export const SaveLayoutModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const saveLayout = useLayoutStore((s) => s.saveLayout);
  const overwriteLayout = useLayoutStore((s) => s.overwriteLayout);
  const setProjectLayout = useLayoutStore((s) => s.setProjectLayout);
  const savedLayouts = useLayoutStore((s) => s.savedLayouts);
  const projectPath = useProjectStore((s) => s.projectPath);

  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bindToProject, setBindToProject] = useState(!!projectPath);

  const handleSave = () => {
    let id: string;
    if (selectedId) {
      overwriteLayout(selectedId);
      id = selectedId;
    } else {
      const trimmed = name.trim();
      if (!trimmed) return;
      id = saveLayout(trimmed);
    }
    if (bindToProject && projectPath) {
      setProjectLayout(projectPath, id);
    }
    onClose();
  };

  const canSave = selectedId || name.trim();

  return (
    <Modal isOpen onClose={onClose} title={t('save_layout_modal.title')} size="sm">
      {savedLayouts.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">{t('save_layout_modal.overwrite_existing')}</label>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {savedLayouts.map((sl) => (
              <button
                key={sl.id}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  selectedId === sl.id
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-transparent'
                }`}
                onClick={() => {
                  setSelectedId(selectedId === sl.id ? null : sl.id);
                  if (selectedId !== sl.id) setName('');
                }}
              >
                {sl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!selectedId && (
        <FormField label={t('save_layout_modal.save_as_new')}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('save_layout_modal.placeholder')}
            autoFocus
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') handleSave();
            }}
          />
        </FormField>
      )}

      {projectPath && (
        <Checkbox label={t('save_layout_modal.bind_to_project')} checked={bindToProject} onChange={setBindToProject} />
      )}
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleSave}
        confirmText={selectedId ? t('common.overwrite') : t('common.save')}
        confirmDisabled={!canSave}
      />
    </Modal>
  );
};
