export interface GitLogEntry {
  hash: string;
  message: string;
  relativeDate: string;
  author: string;
  taskId: string | null;
  cleanMessage: string;
}

export interface TaskGroup {
  taskId: string;
  entries: GitLogEntry[];
}

export type HistoryItem = { type: 'task'; group: TaskGroup } | { type: 'commit'; entry: GitLogEntry };

const TASK_PREFIX_RE = /^\[task:([^\]]+)\]\s*/;

export function parseLogLine(line: string): GitLogEntry | null {
  const parts = line.split('|');
  if (parts.length < 4) return null;
  const message = parts[1];
  const match = message.match(TASK_PREFIX_RE);
  return {
    hash: parts[0],
    message,
    relativeDate: parts[2],
    author: parts[3],
    taskId: match ? match[1] : null,
    cleanMessage: match ? message.slice(match[0].length) : message,
  };
}

export function buildHistoryItems(entries: GitLogEntry[]): HistoryItem[] {
  const items: HistoryItem[] = [];
  let currentGroup: TaskGroup | null = null;

  for (const entry of entries) {
    if (entry.taskId) {
      if (currentGroup && currentGroup.taskId === entry.taskId) {
        currentGroup.entries.push(entry);
      } else {
        if (currentGroup) {
          items.push({ type: 'task', group: currentGroup });
        }
        currentGroup = { taskId: entry.taskId, entries: [entry] };
      }
    } else {
      if (currentGroup) {
        items.push({ type: 'task', group: currentGroup });
        currentGroup = null;
      }
      items.push({ type: 'commit', entry });
    }
  }
  if (currentGroup) {
    items.push({ type: 'task', group: currentGroup });
  }

  return items;
}
