import { describe, it, expect } from 'vitest';
import { parseLogLine, buildHistoryItems, type GitLogEntry } from '../../components/GitHistory/gitLogUtils';

describe('parseLogLine', () => {
  it('parses a standard log line', () => {
    const result = parseLogLine('abc1234|Fix bug|2 hours ago|Alice');
    expect(result).toEqual({
      hash: 'abc1234',
      message: 'Fix bug',
      relativeDate: '2 hours ago',
      author: 'Alice',
      taskId: null,
      cleanMessage: 'Fix bug',
    });
  });

  it('extracts task ID from message', () => {
    const result = parseLogLine('def5678|[task:TASK-1] Add feature|1 day ago|Bob');
    expect(result).not.toBeNull();
    expect(result!.taskId).toBe('TASK-1');
    expect(result!.cleanMessage).toBe('Add feature');
  });

  it('returns null for malformed lines', () => {
    expect(parseLogLine('not enough parts')).toBeNull();
    expect(parseLogLine('a|b')).toBeNull();
  });

  it('handles messages with pipe chars in author field', () => {
    const result = parseLogLine('abc|msg|3h ago|Name With Spaces');
    expect(result!.author).toBe('Name With Spaces');
  });
});

describe('buildHistoryItems', () => {
  it('returns empty for empty input', () => {
    expect(buildHistoryItems([])).toEqual([]);
  });

  it('wraps non-task entries as commits', () => {
    const entries: GitLogEntry[] = [
      {
        hash: 'a',
        message: 'm',
        relativeDate: '1h',
        author: 'A',
        taskId: null,
        cleanMessage: 'm',
      },
    ];
    const items = buildHistoryItems(entries);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('commit');
  });

  it('groups consecutive entries with same taskId', () => {
    const entries: GitLogEntry[] = [
      {
        hash: 'a',
        message: '[task:T1] x',
        relativeDate: '1h',
        author: 'A',
        taskId: 'T1',
        cleanMessage: 'x',
      },
      {
        hash: 'b',
        message: '[task:T1] y',
        relativeDate: '2h',
        author: 'A',
        taskId: 'T1',
        cleanMessage: 'y',
      },
    ];
    const items = buildHistoryItems(entries);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('task');
    if (items[0].type === 'task') {
      expect(items[0].group.taskId).toBe('T1');
      expect(items[0].group.entries).toHaveLength(2);
    }
  });

  it('splits different task groups', () => {
    const entries: GitLogEntry[] = [
      {
        hash: 'a',
        message: '[task:T1] x',
        relativeDate: '1h',
        author: 'A',
        taskId: 'T1',
        cleanMessage: 'x',
      },
      {
        hash: 'b',
        message: '[task:T2] y',
        relativeDate: '2h',
        author: 'A',
        taskId: 'T2',
        cleanMessage: 'y',
      },
    ];
    const items = buildHistoryItems(entries);
    expect(items).toHaveLength(2);
    expect(items[0].type).toBe('task');
    expect(items[1].type).toBe('task');
  });

  it('interleaves tasks and commits correctly', () => {
    const entries: GitLogEntry[] = [
      {
        hash: 'a',
        message: '[task:T1] x',
        relativeDate: '1h',
        author: 'A',
        taskId: 'T1',
        cleanMessage: 'x',
      },
      {
        hash: 'b',
        message: 'standalone',
        relativeDate: '2h',
        author: 'A',
        taskId: null,
        cleanMessage: 'standalone',
      },
      {
        hash: 'c',
        message: '[task:T1] z',
        relativeDate: '3h',
        author: 'A',
        taskId: 'T1',
        cleanMessage: 'z',
      },
    ];
    const items = buildHistoryItems(entries);
    expect(items).toHaveLength(3);
    expect(items[0].type).toBe('task');
    expect(items[1].type).toBe('commit');
    expect(items[2].type).toBe('task');
  });
});
