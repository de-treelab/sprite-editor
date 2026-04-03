import { create } from 'zustand';

export interface UndoAction {
  label: string;
  undo(): void;
  redo(): void;
}

interface HistoryState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  maxDepth: number;

  push(action: UndoAction): void;
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
  clear(): void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxDepth: 50,
  canUndo: false,
  canRedo: false,

  push: (action) =>
    set((state) => {
      const newStack = [...state.undoStack, action];
      if (newStack.length > state.maxDepth) {
        newStack.shift();
      }
      return {
        undoStack: newStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    action.undo();

    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, action],
      canUndo: undoStack.length > 1,
      canRedo: true,
    });
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    action.redo();

    set({
      undoStack: [...undoStack, action],
      redoStack: redoStack.slice(0, -1),
      canUndo: true,
      canRedo: redoStack.length > 1,
    });
  },

  clear: () =>
    set({
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    }),
}));
