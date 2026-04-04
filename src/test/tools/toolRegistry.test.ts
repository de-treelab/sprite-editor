import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerTool,
  unregisterTool,
  getTool,
  getAllTools,
  getToolsByCategory,
  getCategories,
  onRegistryChange,
  buildDefaultToolProperties,
} from '../../tools/toolRegistry';
import type { ToolDefinition } from '../../tools/toolTypes';

function makeTool(id: string, category = 'draw'): ToolDefinition {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    category,
    icon: () => null,
    properties: [{ key: 'size', label: 'Size', type: 'number', min: 1, max: 100, step: 1, default: 4 }],
    onPointerDown: () => {},
    onPointerMove: () => {},
    onPointerUp: () => {},
  } as unknown as ToolDefinition;
}

describe('toolRegistry', () => {
  const testToolId = '__test_tool__';
  const testTool2Id = '__test_tool2__';

  beforeEach(() => {
    // Clean up test tools
    unregisterTool(testToolId);
    unregisterTool(testTool2Id);
  });

  it('registers and retrieves a tool', () => {
    registerTool(makeTool(testToolId));
    expect(getTool(testToolId)).toBeDefined();
    expect(getTool(testToolId)!.id).toBe(testToolId);
  });

  it('getAllTools includes registered tool', () => {
    registerTool(makeTool(testToolId));
    const all = getAllTools();
    expect(all.some((t) => t.id === testToolId)).toBe(true);
  });

  it('unregisterTool removes a tool', () => {
    registerTool(makeTool(testToolId));
    unregisterTool(testToolId);
    expect(getTool(testToolId)).toBeUndefined();
  });

  it('getToolsByCategory filters correctly', () => {
    registerTool(makeTool(testToolId, 'special'));
    const special = getToolsByCategory('special');
    expect(special.some((t) => t.id === testToolId)).toBe(true);
  });

  it('getCategories returns unique categories', () => {
    registerTool(makeTool(testToolId, 'catA'));
    registerTool(makeTool(testTool2Id, 'catA'));
    const cats = getCategories();
    expect(cats.filter((c) => c === 'catA')).toHaveLength(1);
  });

  it('onRegistryChange fires on register', () => {
    let called = false;
    const unsub = onRegistryChange(() => {
      called = true;
    });
    registerTool(makeTool(testToolId));
    expect(called).toBe(true);
    unsub();
  });

  it('onRegistryChange fires on unregister', () => {
    registerTool(makeTool(testToolId));
    let called = false;
    const unsub = onRegistryChange(() => {
      called = true;
    });
    unregisterTool(testToolId);
    expect(called).toBe(true);
    unsub();
  });

  it('unsub stops notifications', () => {
    let count = 0;
    const unsub = onRegistryChange(() => {
      count++;
    });
    unsub();
    registerTool(makeTool(testToolId));
    expect(count).toBe(0);
  });

  it('buildDefaultToolProperties includes registered tool defaults', () => {
    registerTool(makeTool(testToolId));
    const props = buildDefaultToolProperties();
    expect(props[testToolId]).toBeDefined();
    expect(props[testToolId].size).toBe(4);
  });
});
