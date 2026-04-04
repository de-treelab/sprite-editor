import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConflictResolver } from '../../components/ConflictResolver';
import { useTaskStore } from '../../store/taskStore';

describe('ConflictResolver', () => {
  beforeEach(() => {
    // Reset task store
    useTaskStore.setState({
      conflict: null,
      activeTask: null,
    });
  });

  it('renders nothing when no conflict', () => {
    const { container } = render(<ConflictResolver />);
    expect(container.firstChild).toBeNull();
  });

  it('renders conflict UI when conflict exists', () => {
    useTaskStore.setState({
      conflict: {
        files: ['src/main.ts', 'src/app.ts'],
        taskBranch: 'task/feature',
        mainBranch: 'main',
      },
    });

    render(<ConflictResolver />);
    expect(screen.getByText('conflict.title')).toBeInTheDocument();
    expect(screen.getByText('src/main.ts')).toBeInTheDocument();
    expect(screen.getByText('src/app.ts')).toBeInTheDocument();
  });

  it('shows bulk action buttons when files exist', () => {
    useTaskStore.setState({
      conflict: {
        files: ['file.ts'],
        taskBranch: 'task/x',
        mainBranch: 'main',
      },
    });

    render(<ConflictResolver />);
    expect(screen.getByText('conflict.keep_all_mine')).toBeInTheDocument();
    expect(screen.getByText('conflict.keep_all_theirs')).toBeInTheDocument();
  });

  it('shows all-resolved state when files are empty', () => {
    useTaskStore.setState({
      conflict: {
        files: [],
        taskBranch: 'task/x',
        mainBranch: 'main',
      },
    });

    render(<ConflictResolver />);
    expect(screen.getByText('conflict.all_resolved')).toBeInTheDocument();
    expect(screen.getByText('common.continue')).toBeInTheDocument();
  });

  it('shows per-file resolve buttons', () => {
    useTaskStore.setState({
      conflict: {
        files: ['a.ts'],
        taskBranch: 'task/x',
        mainBranch: 'main',
      },
    });

    render(<ConflictResolver />);
    expect(screen.getByText('conflict.keep_mine')).toBeInTheDocument();
    expect(screen.getByText('conflict.keep_theirs')).toBeInTheDocument();
  });

  it('shows active task name when present', () => {
    useTaskStore.setState({
      conflict: {
        files: ['a.ts'],
        taskBranch: 'task/fix-bug',
        mainBranch: 'main',
      },
      activeTask: {
        id: '1',
        name: 'Fix Bug',
        branch: 'task/fix-bug',
        createdAt: new Date().toISOString(),
        status: 'active',
      },
    });

    render(<ConflictResolver />);
    expect(screen.getByText('Fix Bug')).toBeInTheDocument();
  });
});
