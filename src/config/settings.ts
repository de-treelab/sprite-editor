// Settings definition system
// Each setting has a unique dotted ID (e.g. "editor.keybindings.canvas.toolPencil"),
// a type, a default value, and metadata for UI rendering.

export type SettingType = 'string' | 'number' | 'boolean' | 'keybinding' | 'path' | 'select';

export interface SettingDefinitionBase {
  id: string;
  label: string;
  description?: string;
  category: string; // dotted path, e.g. "editor.keybindings"
}

export interface StringSetting extends SettingDefinitionBase {
  type: 'string';
  default: string;
}

export interface NumberSetting extends SettingDefinitionBase {
  type: 'number';
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanSetting extends SettingDefinitionBase {
  type: 'boolean';
  default: boolean;
}

export interface KeybindingSetting extends SettingDefinitionBase {
  type: 'keybinding';
  default: string;
}

export interface PathSetting extends SettingDefinitionBase {
  type: 'path';
  default: string;
  pathType?: 'file' | 'directory';
}

export interface SelectSetting extends SettingDefinitionBase {
  type: 'select';
  default: string;
  options: { value: string; label: string }[];
}

export type SettingDefinition =
  | StringSetting
  | NumberSetting
  | BooleanSetting
  | KeybindingSetting
  | PathSetting
  | SelectSetting;

// Category tree node for sidebar
export interface CategoryNode {
  id: string;       // dotted path
  label: string;
  children: CategoryNode[];
}

// Build category tree from setting definitions
export function buildCategoryTree(settings: SettingDefinition[]): CategoryNode[] {
  const categorySet = new Set<string>();
  for (const s of settings) {
    categorySet.add(s.category);
  }

  const root: CategoryNode[] = [];
  const nodeMap = new Map<string, CategoryNode>();

  // Sort categories so parents come before children
  const sorted = [...categorySet].sort();

  for (const cat of sorted) {
    const parts = cat.split('.');
    const label = parts[parts.length - 1];
    const node: CategoryNode = { id: cat, label, children: [] };
    nodeMap.set(cat, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentId = parts.slice(0, -1).join('.');
      const parent = nodeMap.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan — create parent implicitly
        const implicitParent: CategoryNode = { id: parentId, label: parts[parts.length - 2], children: [node] };
        nodeMap.set(parentId, implicitParent);
        root.push(implicitParent);
      }
    }
  }

  return root;
}

// Get default values map from definitions
export function getDefaults(settings: SettingDefinition[]): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const s of settings) {
    defaults[s.id] = s.default;
  }
  return defaults;
}
