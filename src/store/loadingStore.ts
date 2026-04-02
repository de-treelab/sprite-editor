import { create } from 'zustand';

export type LoadingMode = 'overlay' | 'status';

interface LoadingState {
  isLoading: boolean;
  message: string;
  mode: LoadingMode;
  setLoading: (loading: boolean, message?: string, mode?: LoadingMode) => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  isLoading: false,
  message: 'Loading…',
  mode: 'overlay',
  setLoading: (loading, message = 'Loading…', mode = 'overlay') => set({ isLoading: loading, message, mode }),
}));
