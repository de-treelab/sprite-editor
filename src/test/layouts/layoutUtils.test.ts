import { describe, it, expect } from 'vitest';
import {
  findPanel,
  findPanelByViewId,
  viewExistsInTree,
  findParent,
  removeViewFromTree,
  cleanupTree,
  insertViewAtAnchor,
  replaceNode,
  collectViewIds,
} from '../../layouts/layoutUtils';
import type { LayoutPanel, LayoutSplit } from '../../layouts/layoutTypes';

const makePanel = (id: string, viewIds: string[], active?: string): LayoutPanel => ({
  type: 'panel',
  id,
  viewIds,
  activeViewId: active ?? viewIds[0] ?? '',
});

const makeSplit = (
  id: string,
  direction: 'horizontal' | 'vertical',
  children: (LayoutPanel | LayoutSplit)[],
  sizes?: number[],
): LayoutSplit => ({
  type: 'split',
  id,
  direction,
  children,
  sizes: sizes ?? children.map(() => 1 / children.length),
});

describe('findPanel', () => {
  it('finds panel by id', () => {
    const panel = makePanel('p1', ['canvas']);
    expect(findPanel(panel, 'p1')).toBe(panel);
  });

  it('returns null for missing panel', () => {
    const panel = makePanel('p1', ['canvas']);
    expect(findPanel(panel, 'p2')).toBeNull();
  });

  it('finds nested panel', () => {
    const p1 = makePanel('p1', ['canvas']);
    const p2 = makePanel('p2', ['timeline']);
    const root = makeSplit('s1', 'horizontal', [p1, p2]);
    expect(findPanel(root, 'p2')).toBe(p2);
  });
});

describe('findPanelByViewId', () => {
  it('finds panel containing a view', () => {
    const panel = makePanel('p1', ['canvas', 'preview']);
    expect(findPanelByViewId(panel, 'preview')?.id).toBe('p1');
  });

  it('returns null if view not found', () => {
    const panel = makePanel('p1', ['canvas']);
    expect(findPanelByViewId(panel, 'timeline')).toBeNull();
  });
});

describe('viewExistsInTree', () => {
  it('returns true for existing view', () => {
    const root = makeSplit('s1', 'horizontal', [makePanel('p1', ['canvas']), makePanel('p2', ['timeline'])]);
    expect(viewExistsInTree(root, 'canvas')).toBe(true);
  });

  it('returns false for missing view', () => {
    const root = makePanel('p1', ['canvas']);
    expect(viewExistsInTree(root, 'settings')).toBe(false);
  });
});

describe('findParent', () => {
  it('returns parent split of a child', () => {
    const p1 = makePanel('p1', ['canvas']);
    const p2 = makePanel('p2', ['timeline']);
    const root = makeSplit('s1', 'horizontal', [p1, p2]);
    expect(findParent(root, 'p1')?.id).toBe('s1');
  });

  it('returns null for root node', () => {
    const root = makePanel('p1', ['canvas']);
    expect(findParent(root, 'p1')).toBeNull();
  });
});

describe('removeViewFromTree', () => {
  it('removes view from panel', () => {
    const root = makePanel('p1', ['canvas', 'preview']);
    const result = removeViewFromTree(root, 'preview');
    expect(result.type).toBe('panel');
    if (result.type === 'panel') {
      expect(result.viewIds).toEqual(['canvas']);
    }
  });

  it('collapses split when panel becomes empty', () => {
    const root = makeSplit('s1', 'horizontal', [makePanel('p1', ['canvas']), makePanel('p2', ['timeline'])]);
    const result = removeViewFromTree(root, 'timeline');
    // The split should collapse to just the remaining panel
    expect(result.type).toBe('panel');
    if (result.type === 'panel') {
      expect(result.viewIds).toEqual(['canvas']);
    }
  });
});

describe('cleanupTree', () => {
  it('collapses single-child split', () => {
    const panel = makePanel('p1', ['canvas']);
    const root = makeSplit('s1', 'horizontal', [panel]);
    const result = cleanupTree(root);
    expect(result.type).toBe('panel');
  });

  it('removes empty panels from split', () => {
    const root = makeSplit('s1', 'horizontal', [makePanel('p1', []), makePanel('p2', ['canvas'])]);
    const result = cleanupTree(root);
    expect(result.type).toBe('panel');
    if (result.type === 'panel') {
      expect(result.viewIds).toEqual(['canvas']);
    }
  });

  it('normalizes sizes after removal', () => {
    const root = makeSplit(
      's1',
      'horizontal',
      [makePanel('p1', []), makePanel('p2', ['canvas']), makePanel('p3', ['timeline'])],
      [0.2, 0.3, 0.5],
    );
    const result = cleanupTree(root);
    if (result.type === 'split') {
      const total = result.sizes.reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1);
    }
  });
});

describe('insertViewAtAnchor', () => {
  it('adds view as tab with center anchor', () => {
    const root = makePanel('p1', ['canvas']);
    const result = insertViewAtAnchor(root, 'preview', 'p1', 'center');
    expect(result.type).toBe('panel');
    if (result.type === 'panel') {
      expect(result.viewIds).toContain('preview');
      expect(result.activeViewId).toBe('preview');
    }
  });

  it('creates horizontal split with left anchor', () => {
    const root = makePanel('p1', ['canvas']);
    const result = insertViewAtAnchor(root, 'timeline', 'p1', 'left');
    expect(result.type).toBe('split');
    if (result.type === 'split') {
      expect(result.direction).toBe('horizontal');
      expect(result.children).toHaveLength(2);
      // New panel should be first (left)
      const first = result.children[0] as LayoutPanel;
      expect(first.viewIds).toEqual(['timeline']);
    }
  });

  it('creates vertical split with bottom anchor', () => {
    const root = makePanel('p1', ['canvas']);
    const result = insertViewAtAnchor(root, 'timeline', 'p1', 'bottom');
    expect(result.type).toBe('split');
    if (result.type === 'split') {
      expect(result.direction).toBe('vertical');
      // New panel should be second (bottom)
      const second = result.children[1] as LayoutPanel;
      expect(second.viewIds).toEqual(['timeline']);
    }
  });

  it('does not duplicate view in panel', () => {
    const root = makePanel('p1', ['canvas']);
    const result = insertViewAtAnchor(root, 'canvas', 'p1', 'center');
    if (result.type === 'panel') {
      expect(result.viewIds).toEqual(['canvas']);
    }
  });
});

describe('replaceNode', () => {
  it('replaces root node', () => {
    const root = makePanel('p1', ['canvas']);
    const replacement = makePanel('p2', ['timeline']);
    const result = replaceNode(root, 'p1', replacement);
    expect(result).toBe(replacement);
  });

  it('replaces nested node', () => {
    const root = makeSplit('s1', 'horizontal', [makePanel('p1', ['canvas']), makePanel('p2', ['timeline'])]);
    const replacement = makePanel('p3', ['preview']);
    const result = replaceNode(root, 'p2', replacement);
    if (result.type === 'split') {
      expect((result.children[1] as LayoutPanel).viewIds).toEqual(['preview']);
    }
  });
});

describe('collectViewIds', () => {
  it('collects from single panel', () => {
    expect(collectViewIds(makePanel('p1', ['canvas', 'preview']))).toEqual(['canvas', 'preview']);
  });

  it('collects from nested tree', () => {
    const root = makeSplit('s1', 'horizontal', [
      makePanel('p1', ['canvas']),
      makeSplit('s2', 'vertical', [makePanel('p2', ['timeline']), makePanel('p3', ['preview', 'layers'])]),
    ]);
    const ids = collectViewIds(root);
    expect(ids).toContain('canvas');
    expect(ids).toContain('timeline');
    expect(ids).toContain('preview');
    expect(ids).toContain('layers');
    expect(ids).toHaveLength(4);
  });
});
