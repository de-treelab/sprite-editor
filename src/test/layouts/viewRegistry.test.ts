import { describe, it, expect, beforeEach } from 'vitest';
import { registerView, getView, getAllViews } from '../../layouts/viewRegistry';

describe('viewRegistry', () => {
  const testViewId = '__test_view__';

  // Note: viewRegistry has no unregister, so we just re-register for each test
  beforeEach(() => {
    // Register a fresh test view
    registerView({
      id: testViewId,
      title: 'Test View',
      icon: () => null as any,
      component: () => null as any,
    });
  });

  it('registers and retrieves a view', () => {
    const view = getView(testViewId);
    expect(view).toBeDefined();
    expect(view!.title).toBe('Test View');
  });

  it('getAllViews includes registered view', () => {
    const all = getAllViews();
    expect(all.some((v) => v.id === testViewId)).toBe(true);
  });

  it('getView returns undefined for unknown id', () => {
    expect(getView('nonexistent_view')).toBeUndefined();
  });

  it('overwriting a view updates it', () => {
    registerView({
      id: testViewId,
      title: 'Updated View',
      icon: () => null as any,
      component: () => null as any,
    });
    expect(getView(testViewId)!.title).toBe('Updated View');
  });
});
