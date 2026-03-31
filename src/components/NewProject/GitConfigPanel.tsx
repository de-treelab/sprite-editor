import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, TextInput, Checkbox } from '../ui';

interface GitConfigPanelProps {
  initGit: boolean;
  onInitGitChange: (value: boolean) => void;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
}

export const GitConfigPanel: React.FC<GitConfigPanelProps> = ({
  initGit,
  onInitGitChange,
  remoteUrl,
  onRemoteUrlChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <Checkbox
        checked={initGit}
        onChange={onInitGitChange}
        label={t('new_project.init_git', 'Initialize Git repository')}
      />
      {initGit && (
        <FormField label={t('new_project.remote_url', 'Remote URL (optional)')}>
          <TextInput
            value={remoteUrl}
            onChange={(e) => onRemoteUrlChange(e.target.value)}
            placeholder="https://github.com/user/repo.git"
            size="sm"
          />
        </FormField>
      )}
    </div>
  );
};
