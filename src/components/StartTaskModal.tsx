import React, { useState, useEffect, useMemo } from 'react';
import { useTaskStore, TaskInfo } from '../store/taskStore';
import { Modal, ModalFooter, FormField, TextInput } from './ui';
import { TaskSuggestions } from './Task/TaskSuggestions';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
  onSkip?: () => void;
}

/** Simple word-overlap similarity score (0–1) */
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export const StartTaskModal: React.FC<Props> = ({ onClose, onSkip }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [taskId, setTaskId] = useState('');
  const startTask = useTaskStore((s) => s.startTask);
  const amendTask = useTaskStore((s) => s.amendTask);
  const recentTasks = useTaskStore((s) => s.recentTasks);
  const syncFromGit = useTaskStore((s) => s.syncFromGit);
  const generateNextTaskId = useTaskStore((s) => s.generateNextTaskId);

  useEffect(() => {
    syncFromGit().then(() => {
      setTaskId(useTaskStore.getState().generateNextTaskId());
    });
  }, [syncFromGit]);

  // Fallback: generate default ID if still empty after sync
  useEffect(() => {
    if (!taskId) {
      setTaskId(generateNextTaskId());
    }
  }, [generateNextTaskId, taskId]);

  const finishedTasks = useMemo(
    () => recentTasks.filter((t) => t.status === 'finished'),
    [recentTasks],
  );

  // Find similar tasks based on the typed name
  const similarTasks = useMemo(() => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return [];
    return finishedTasks
      .map((t) => ({ task: t, score: similarity(trimmed, t.name) }))
      .filter(({ score }) => score >= 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ task }) => task);
  }, [name, finishedTasks]);

  // Show similar matches, or recent finished tasks when no name typed
  const suggestedTasks = similarTasks.length > 0 ? similarTasks : finishedTasks.slice(0, 5);

  const handleStart = async () => {
    const trimmedName = name.trim();
    const trimmedId = taskId.trim();
    if (!trimmedName || !trimmedId) return;
    try {
      await startTask(trimmedId, trimmedName);
      onClose();
    } catch (e) {
      console.error('Failed to start task:', e);
    }
  };

  const handleAmend = async (task: TaskInfo) => {
    try {
      await amendTask(task);
      onClose();
    } catch (e) {
      console.error('Failed to amend task:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && taskId.trim()) {
      handleStart();
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t('task.start_title')}
      size="md"
      footer={
        <ModalFooter
          onCancel={onSkip || onClose}
          onConfirm={handleStart}
          cancelText={onSkip ? t('task.save_without_task') : t('common.cancel')}
          confirmText={t('task.start_new')}
          confirmDisabled={!name.trim() || !taskId.trim()}
        />
      }
    >
      <FormField label={t('task.task_id')} hint={t('task.task_id_hint')}>
        <TextInput
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder={t('task.task_id_placeholder')}
          onKeyDown={handleKeyDown}
        />
      </FormField>

      <FormField label={t('task.task_name')} hint={t('task.task_name_hint')}>
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('task.task_name_placeholder')}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </FormField>

      <TaskSuggestions
        suggestedTasks={suggestedTasks}
        hasSimilarMatches={similarTasks.length > 0}
        onAmend={handleAmend}
      />
    </Modal>
  );
};
