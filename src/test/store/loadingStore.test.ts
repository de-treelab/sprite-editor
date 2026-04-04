import { describe, it, expect } from 'vitest';
import { useLoadingStore } from '../../store/loadingStore';

describe('loadingStore', () => {
  it('starts not loading', () => {
    const state = useLoadingStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.mode).toBe('overlay');
  });

  it('sets loading with default message and mode', () => {
    useLoadingStore.getState().setLoading(true);
    const state = useLoadingStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.message).toBe('Loading…');
    expect(state.mode).toBe('overlay');
  });

  it('sets loading with custom message', () => {
    useLoadingStore.getState().setLoading(true, 'Saving...');
    expect(useLoadingStore.getState().message).toBe('Saving...');
  });

  it('sets loading with status mode', () => {
    useLoadingStore.getState().setLoading(true, 'Exporting', 'status');
    const state = useLoadingStore.getState();
    expect(state.mode).toBe('status');
    expect(state.message).toBe('Exporting');
  });

  it('clears loading', () => {
    useLoadingStore.getState().setLoading(true, 'Busy');
    useLoadingStore.getState().setLoading(false);
    expect(useLoadingStore.getState().isLoading).toBe(false);
  });
});
