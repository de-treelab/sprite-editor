import { SettingDefinition } from './settings';

export const gitSettings: SettingDefinition[] = [
  {
    id: 'git.enabled',
    type: 'boolean',
    label: 'Enable Git',
    description:
      'Automatically initialize git for new projects and auto-commit on save. When enabled on an existing project, initializes git if not already a repository.',
    category: 'git',
    default: true,
  },
  {
    id: 'git.remote',
    type: 'string',
    label: 'Default Remote URL',
    description:
      'Default remote repository URL for new projects (e.g. https://github.com/user/repo.git). Leave empty to skip remote setup.',
    category: 'git',
    default: '',
  },
  {
    id: 'git.mainBranch',
    type: 'string',
    label: 'Main Branch',
    description: 'Name of the main branch. Tasks are created from and merged back into this branch.',
    category: 'git',
    default: 'main',
  },
  {
    id: 'git.authorName',
    type: 'string',
    label: 'Author Name',
    description:
      'Your name, used as a prefix in task branch names (e.g. task/alice/abc123-my-task). Leave empty to omit.',
    category: 'git',
    default: '',
  },
  {
    id: 'project.task.prefix',
    type: 'string',
    label: 'Task ID Prefix',
    description:
      'Prefix for auto-generated task IDs (e.g. "SPRITE" → SPRITE-1, SPRITE-2). Useful for syncing with external tools like Jira or GitHub Projects.',
    category: 'project.task',
    default: 'TASK',
  },
  {
    id: 'project.task.taskIdPattern',
    type: 'string',
    label: 'Task ID Pattern',
    description:
      'Pattern for auto-generating task IDs. Use {{prefix}} and {{index}} as placeholders. Default: "{{prefix}}-{{index}}".',
    category: 'project.task',
    default: '{{prefix}}-{{index}}',
  },
];
