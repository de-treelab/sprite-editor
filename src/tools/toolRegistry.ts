import type { ToolDefinition } from './toolTypes';

const registry = new Map<string, ToolDefinition>();
const listeners = new Set<() => void>();

/** Register a tool. Can be called at import-time or dynamically. */
export function registerTool(tool: ToolDefinition): void {
  if (registry.has(tool.id)) {
    console.warn(`Tool "${tool.id}" is already registered. Overwriting.`);
  }
  registry.set(tool.id, tool);
  listeners.forEach((fn) => fn());
}

/** Unregister a tool (for plugin unloading). */
export function unregisterTool(id: string): void {
  registry.delete(id);
  listeners.forEach((fn) => fn());
}

export function getTool(id: string): ToolDefinition | undefined {
  return registry.get(id);
}

export function getAllTools(): ToolDefinition[] {
  return Array.from(registry.values());
}

export function getToolsByCategory(category: string): ToolDefinition[] {
  return getAllTools().filter((t) => t.category === category);
}

/** Returns categories in registration order (first tool registered in a category defines its order). */
export function getCategories(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const tool of registry.values()) {
    if (!seen.has(tool.category)) {
      seen.add(tool.category);
      result.push(tool.category);
    }
  }
  return result;
}

/** Subscribe to registry changes (for reactive UI). Returns unsubscribe function. */
export function onRegistryChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Build default tool properties state from all registered tools. */
export function buildDefaultToolProperties(): Record<string, Record<string, number | string | boolean>> {
  const defaults: Record<string, Record<string, number | string | boolean>> = {};
  for (const tool of registry.values()) {
    defaults[tool.id] = {};
    for (const prop of tool.properties) {
      defaults[tool.id][prop.key] = prop.default;
    }
  }
  return defaults;
}
