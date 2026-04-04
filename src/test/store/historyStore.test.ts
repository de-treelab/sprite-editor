import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from '../../store/historyStore';

describe('historyStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
  });

  it('starts empty', () => {
    const state = useHistoryStore.getState();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
  });

  it('push adds to undo stack', () => {
    const action = {
      label: 'paint',
      undo: () => {},
      redo: () => {},
    };
    useHistoryStore.getState().push(action);
    const state = useHistoryStore.getState();
    expect(state.undoStack).toHaveLength(1);
    expect(state.canUndo).toBe(true);
  });

  it('push clears redo stack', () => {
    useHistoryStore.getState().push({
      label: 'a',
      undo: () => {},
      redo: () => {},
    });
    useHistoryStore.getState().push({
      label: 'b',
      undo: () => {},
      redo: () => {},
    });
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo).toBe(true);

    // Push a new action should clear redo
    useHistoryStore.getState().push({
      label: 'c',
      undo: () => {},
      redo: () => {},
    });
    expect(useHistoryStore.getState().canRedo).toBe(false);
  });

  it('undo calls action.undo and moves to redo stack', () => {
    let value = 0;
    useHistoryStore.getState().push({
      label: 'inc',
      undo: () => {
        value = 0;
      },
      redo: () => {
        value = 1;
      },
    });

    value = 1;
    useHistoryStore.getState().undo();
    expect(value).toBe(0);
    expect(useHistoryStore.getState().canUndo).toBe(false);
    expect(useHistoryStore.getState().canRedo).toBe(true);
  });

  it('redo calls action.redo and moves back to undo stack', () => {
    let value = 0;
    useHistoryStore.getState().push({
      label: 'inc',
      undo: () => {
        value = 0;
      },
      redo: () => {
        value = 1;
      },
    });

    useHistoryStore.getState().undo();
    useHistoryStore.getState().redo();
    expect(value).toBe(1);
    expect(useHistoryStore.getState().canUndo).toBe(true);
    expect(useHistoryStore.getState().canRedo).toBe(false);
  });

  it('undo does nothing when stack is empty', () => {
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().undoStack).toHaveLength(0);
  });

  it('redo does nothing when stack is empty', () => {
    useHistoryStore.getState().redo();
    expect(useHistoryStore.getState().redoStack).toHaveLength(0);
  });

  it('enforces max depth', () => {
    const store = useHistoryStore.getState();
    for (let i = 0; i < 60; i++) {
      useHistoryStore.getState().push({
        label: `action-${i}`,
        undo: () => {},
        redo: () => {},
      });
    }
    expect(useHistoryStore.getState().undoStack.length).toBeLessThanOrEqual(store.maxDepth);
  });

  it('clear resets everything', () => {
    useHistoryStore.getState().push({
      label: 'a',
      undo: () => {},
      redo: () => {},
    });
    useHistoryStore.getState().clear();
    const state = useHistoryStore.getState();
    expect(state.undoStack).toHaveLength(0);
    expect(state.redoStack).toHaveLength(0);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
  });

  it('multiple undo/redo cycle works', () => {
    const values: number[] = [];
    useHistoryStore.getState().push({
      label: '1',
      undo: () => values.push(-1),
      redo: () => values.push(1),
    });
    useHistoryStore.getState().push({
      label: '2',
      undo: () => values.push(-2),
      redo: () => values.push(2),
    });

    useHistoryStore.getState().undo(); // undo "2"
    useHistoryStore.getState().undo(); // undo "1"
    expect(values).toEqual([-2, -1]);
    expect(useHistoryStore.getState().canUndo).toBe(false);
    expect(useHistoryStore.getState().canRedo).toBe(true);

    useHistoryStore.getState().redo(); // redo "1"
    useHistoryStore.getState().redo(); // redo "2"
    expect(values).toEqual([-2, -1, 1, 2]);
  });
});
