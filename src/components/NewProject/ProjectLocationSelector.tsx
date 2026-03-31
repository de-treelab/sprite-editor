import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconRegistry } from '../IconRegistry';
import { FormField, TextInput, Button } from '../ui';

interface ProjectLocationSelectorProps {
  parentPath: string;
  fullPath: string;
  folderExists: boolean;
  onBrowse: () => void;
}

export const ProjectLocationSelector: React.FC<ProjectLocationSelectorProps> = ({
  parentPath,
  fullPath,
  folderExists,
  onBrowse,
}) => {
  const { t } = useTranslation();

  return (
    <FormField label={t('new_project.location', 'Location')} required>
      <div className="flex space-x-2">
        <TextInput
          value={parentPath}
          readOnly
          placeholder={t('new_project.select_location', 'Select parent folder...')}
          size="sm"
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={onBrowse}
        >
          {t('new_project.browse', 'Browse')}
        </Button>
      </div>
      {fullPath && (
        <div className="mt-2 flex items-start space-x-2">
          <p className="text-xs text-slate-500 break-all">
            {t('new_project.will_be_created_at', 'Project will be created at:')} <br/>
            <span className="text-indigo-400 font-mono">{fullPath}</span>
          </p>
          {folderExists && (
            <div className="flex items-center text-red-500 mt-3" title="Folder already exists">
              <IconRegistry.Alert className="text-xl" />
            </div>
          )}
        </div>
      )}
    </FormField>
  );
};
