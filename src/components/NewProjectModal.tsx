import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { AppProject } from '../types/project';
import { open } from '@tauri-apps/plugin-dialog';
import { saveProjectV2, checkFolderExists, gitInit, gitCommit, gitRemoteAdd } from '../services/backend';
import { useLoadingStore } from '../store/loadingStore';
import { useSettingsStore } from '../store/settingsStore';
import { join } from '@tauri-apps/api/path';
import { useTranslation } from 'react-i18next';
import { generate_id } from '../utils/id';
import { normalizeProjectName } from '../utils/string';
import { Modal, ModalFooter, FormField, TextInput, NumberInput } from './ui';
import { ProjectLocationSelector } from './NewProject/ProjectLocationSelector';
import { GitConfigPanel } from './NewProject/GitConfigPanel';

interface Props {
  onClose: () => void;
}

export const NewProjectModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const gitEnabled = useSettingsStore((s) => s.getValue<boolean>('git.enabled'));
  const gitDefaultRemote = useSettingsStore((s) => s.getValue<string>('git.remote'));

  const [name, setName] = useState(t('new_project.default_name', 'New Project'));
  const [width, setWidth] = useState<number>(32);
  const [height, setHeight] = useState<number>(32);
  const [parentPath, setParentPath] = useState<string>('');
  const [fullPath, setFullPath] = useState<string>('');
  const [folderExists, setFolderExists] = useState<boolean>(false);
  const [initGit, setInitGit] = useState<boolean>(gitEnabled);
  const [remoteUrl, setRemoteUrl] = useState<string>(gitDefaultRemote);

  const setProject = useProjectStore(state => state.setProject);
  const setProjectPath = useProjectStore(state => state.setProjectPath);
  const setActiveSpritesheet = useProjectStore(state => state.setActiveSpritesheet);
  const setActiveItem = useProjectStore(state => state.setActiveItem);
  const setActiveFrame = useProjectStore(state => state.setActiveFrame);
  const setActiveLayer = useProjectStore(state => state.setActiveLayer);

  useEffect(() => {
    const savedLocation = localStorage.getItem('defaultProjectLocation');
    if (savedLocation) {
      setParentPath(savedLocation);
    }
  }, []);

  useEffect(() => {
    const updatePath = async () => {
      if (parentPath && name) {
        try {
          const normalized = normalizeProjectName(name);
          let sep = parentPath.includes('\\') ? '\\' : '/';
          let safeParent = parentPath.endsWith(sep) ? parentPath.slice(0, -1) : parentPath;
          let newFullPath = `${safeParent}${sep}${normalized}`;

          try {
            newFullPath = await join(parentPath, normalized);
          } catch (e) {
            // ignore
          }
          setFullPath(newFullPath);

          try {
            const exists = await checkFolderExists(newFullPath);
            setFolderExists(exists);
          } catch (e) {
            setFolderExists(false);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setFullPath('');
        setFolderExists(false);
      }
    };
    updatePath();
  }, [parentPath, name]);

  const handleSelectFolder = async () => {
    try {
      const dir = await open({ directory: true, multiple: false });
      if (dir) {
        setParentPath(dir as string);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!parentPath) {
      alert(t('new_project.error_no_location', 'Please select a location for the project.'));
      return;
    }

    const safeWidth = width > 0 ? width : 32;
    const safeHeight = height > 0 ? height : 32;

    const newProject: AppProject = {
      id: generate_id(),
      name,
      defaultCanvasSize: { width: safeWidth, height: safeHeight },
      palettes: [],
      spritesheets: []
    };

    const { setLoading } = useLoadingStore.getState();
    setLoading(true, t('loading.creating', 'Creating project…'));

    if (fullPath) {
      try {
        // Build a v2 save manifest for the new (empty) project
        const manifest = JSON.stringify({
          project: {
            id: newProject.id,
            name: newProject.name,
            defaultCanvasSize: newProject.defaultCanvasSize,
          },
          palettes: [],
          deleted_palettes: [],
          deleted_spritesheets: [],
          write_gitignore: initGit,
          spritesheets: [],
        });
        await saveProjectV2(fullPath, manifest);
        localStorage.setItem('defaultProjectLocation', parentPath);

        try {
           const recents = JSON.parse(localStorage.getItem('recentProjects') || '[]');
           const updated = [fullPath, ...recents.filter((p: string) => p !== fullPath)].slice(0, 5);
           localStorage.setItem('recentProjects', JSON.stringify(updated));
        } catch (e) {
           console.error("Failed to parse recents", e);
        }

        // Initialize git repository if requested
        if (initGit) {
          try {
            await gitInit(fullPath);
            if (remoteUrl.trim()) {
              await gitRemoteAdd(fullPath, remoteUrl.trim());
            }
            await gitCommit(fullPath, 'Initial commit');
          } catch (gitErr) {
            console.error("Git initialization failed", gitErr);
          }
        }
      } catch (err) {
        console.error("Failed to save project initially", err);
        alert(t('new_project.error_save_failed', 'Could not save to the selected folder.') + "\n" + err);
        setLoading(false);
        return;
      }
    }

    setProject(newProject);
    setProjectPath(fullPath || null);
    setActiveSpritesheet(null);
    setActiveItem(null);
    setActiveFrame(null);
    setActiveLayer(null);
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('new_project.title', 'Create New Project')}
      size="md"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleCreate}
          cancelText={t('common.cancel', 'Cancel')}
          confirmText={t('common.create', 'Create')}
          confirmDisabled={!parentPath || !name}
        />
      }
    >
      <FormField label={t('new_project.project_name', 'Project Name')}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </FormField>

      <div className="flex space-x-4">
        <FormField label={t('new_project.width', 'Width (px)')} className="flex-1">
          <NumberInput
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 32)}
            min={1}
            max={4096}
            required
          />
        </FormField>
        <FormField label={t('new_project.height', 'Height (px)')} className="flex-1">
          <NumberInput
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value) || 32)}
            min={1}
            max={4096}
            required
          />
        </FormField>
      </div>

      <ProjectLocationSelector
        parentPath={parentPath}
        fullPath={fullPath}
        folderExists={folderExists}
        onBrowse={handleSelectFolder}
      />

      <GitConfigPanel
        initGit={initGit}
        onInitGitChange={setInitGit}
        remoteUrl={remoteUrl}
        onRemoteUrlChange={setRemoteUrl}
      />
    </Modal>
  );
};
