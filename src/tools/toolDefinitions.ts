import { IconType } from 'react-icons';
import { IconRegistry } from '../components/IconRegistry';

// Property types that tools can have
export type ToolPropertyType = 'number' | 'select' | 'boolean';

export interface ToolPropertyBase {
  key: string;
  label: string;
  type: ToolPropertyType;
}

export interface NumberProperty extends ToolPropertyBase {
  type: 'number';
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface SelectProperty extends ToolPropertyBase {
  type: 'select';
  options: { value: string; label: string }[];
  default: string;
}

export interface BooleanProperty extends ToolPropertyBase {
  type: 'boolean';
  default: boolean;
}

export type ToolProperty = NumberProperty | SelectProperty | BooleanProperty;

// Tool definition interface
export interface ToolDefinition {
  id: string;
  labelKey: string;
  defaultLabel: string;
  icon: IconType;
  category: 'draw' | 'select' | 'transform' | 'utility';
  properties: ToolProperty[];
  cursor?: string;
}

// All tool IDs for type safety
export type ToolId =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'picker'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'selection'
  | 'magicWand'
  | 'move'
  | 'pan'
  | 'scale'
  | 'rotate'
  | 'transform'
  | 'flipHorizontal'
  | 'flipVertical';

// Tool definitions registry
export const toolDefinitions: Record<ToolId, ToolDefinition> = {
  // Drawing tools
  pencil: {
    id: 'pencil',
    labelKey: 'sidebar.tools.pencil',
    defaultLabel: 'Pencil',
    icon: IconRegistry.ToolPencil,
    category: 'draw',
    cursor: 'crosshair',
    properties: [
      {
        key: 'brushSize',
        label: 'Brush Size',
        type: 'number',
        min: 1,
        max: 64,
        step: 1,
        default: 1,
      },
      {
        key: 'brushShape',
        label: 'Brush Shape',
        type: 'select',
        options: [
          { value: 'square', label: 'Square' },
          { value: 'circle', label: 'Circle' },
        ],
        default: 'square',
      },
    ],
  },

  eraser: {
    id: 'eraser',
    labelKey: 'sidebar.tools.eraser',
    defaultLabel: 'Eraser',
    icon: IconRegistry.ToolEraser,
    category: 'draw',
    cursor: 'crosshair',
    properties: [
      {
        key: 'brushSize',
        label: 'Eraser Size',
        type: 'number',
        min: 1,
        max: 64,
        step: 1,
        default: 1,
      },
      {
        key: 'brushShape',
        label: 'Eraser Shape',
        type: 'select',
        options: [
          { value: 'square', label: 'Square' },
          { value: 'circle', label: 'Circle' },
        ],
        default: 'square',
      },
    ],
  },

  fill: {
    id: 'fill',
    labelKey: 'sidebar.tools.fill',
    defaultLabel: 'Fill',
    icon: IconRegistry.ToolFill,
    category: 'draw',
    cursor: 'crosshair',
    properties: [
      {
        key: 'tolerance',
        label: 'Tolerance',
        type: 'number',
        min: 0,
        max: 255,
        step: 1,
        default: 0,
      },
      {
        key: 'contiguous',
        label: 'Contiguous',
        type: 'boolean',
        default: true,
      },
    ],
  },

  picker: {
    id: 'picker',
    labelKey: 'sidebar.tools.picker',
    defaultLabel: 'Color Picker',
    icon: IconRegistry.ToolPicker,
    category: 'utility',
    cursor: 'crosshair',
    properties: [
      {
        key: 'sampleMerged',
        label: 'Sample Merged',
        type: 'boolean',
        default: false,
      },
    ],
  },

  line: {
    id: 'line',
    labelKey: 'sidebar.tools.line',
    defaultLabel: 'Line',
    icon: IconRegistry.ToolLine,
    category: 'draw',
    cursor: 'crosshair',
    properties: [
      {
        key: 'brushSize',
        label: 'Line Width',
        type: 'number',
        min: 1,
        max: 64,
        step: 1,
        default: 1,
      },
    ],
  },

  rectangle: {
    id: 'rectangle',
    labelKey: 'sidebar.tools.rectangle',
    defaultLabel: 'Rectangle',
    icon: IconRegistry.ToolRectangle,
    category: 'draw',
    cursor: 'crosshair',
    properties: [
      {
        key: 'brushSize',
        label: 'Stroke Width',
        type: 'number',
        min: 1,
        max: 64,
        step: 1,
        default: 1,
      },
      {
        key: 'filled',
        label: 'Filled',
        type: 'boolean',
        default: false,
      },
    ],
  },

  ellipse: {
    id: 'ellipse',
    labelKey: 'sidebar.tools.ellipse',
    defaultLabel: 'Ellipse',
    icon: IconRegistry.ToolEllipse,
    category: 'draw',
    cursor: 'crosshair',
    properties: [
      {
        key: 'brushSize',
        label: 'Stroke Width',
        type: 'number',
        min: 1,
        max: 64,
        step: 1,
        default: 1,
      },
      {
        key: 'filled',
        label: 'Filled',
        type: 'boolean',
        default: false,
      },
    ],
  },

  // Selection tools
  selection: {
    id: 'selection',
    labelKey: 'sidebar.tools.selection',
    defaultLabel: 'Rectangle Select',
    icon: IconRegistry.ToolSelect,
    category: 'select',
    cursor: 'crosshair',
    properties: [
      {
        key: 'selectionMode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'replace', label: 'Replace' },
          { value: 'add', label: 'Add' },
          { value: 'subtract', label: 'Subtract' },
          { value: 'intersect', label: 'Intersect' },
        ],
        default: 'replace',
      },
      {
        key: 'selectionShape',
        label: 'Shape',
        type: 'select',
        options: [
          { value: 'rectangle', label: 'Rectangle' },
          { value: 'ellipse', label: 'Ellipse' },
        ],
        default: 'rectangle',
      },
    ],
  },

  magicWand: {
    id: 'magicWand',
    labelKey: 'sidebar.tools.magicWand',
    defaultLabel: 'Magic Wand',
    icon: IconRegistry.ToolMagicWand,
    category: 'select',
    cursor: 'crosshair',
    properties: [
      {
        key: 'tolerance',
        label: 'Tolerance',
        type: 'number',
        min: 0,
        max: 255,
        step: 1,
        default: 32,
      },
      {
        key: 'contiguous',
        label: 'Contiguous',
        type: 'boolean',
        default: true,
      },
      {
        key: 'selectionMode',
        label: 'Mode',
        type: 'select',
        options: [
          { value: 'replace', label: 'Replace' },
          { value: 'add', label: 'Add' },
          { value: 'subtract', label: 'Subtract' },
          { value: 'intersect', label: 'Intersect' },
        ],
        default: 'replace',
      },
    ],
  },

  // Transform tools
  move: {
    id: 'move',
    labelKey: 'sidebar.tools.move',
    defaultLabel: 'Move',
    icon: IconRegistry.ToolMove,
    category: 'transform',
    cursor: 'move',
    properties: [
      {
        key: 'moveMode',
        label: 'Move',
        type: 'select',
        options: [
          { value: 'selection', label: 'Selection' },
          { value: 'layer', label: 'Layer' },
        ],
        default: 'selection',
      },
    ],
  },

  pan: {
    id: 'pan',
    labelKey: 'sidebar.tools.pan',
    defaultLabel: 'Pan',
    icon: IconRegistry.ToolPan,
    category: 'utility',
    cursor: 'grab',
    properties: [],
  },

  scale: {
    id: 'scale',
    labelKey: 'sidebar.tools.scale',
    defaultLabel: 'Scale',
    icon: IconRegistry.ToolScale,
    category: 'transform',
    cursor: 'nwse-resize',
    properties: [
      {
        key: 'scaleMode',
        label: 'Scale',
        type: 'select',
        options: [
          { value: 'selection', label: 'Selection' },
          { value: 'layer', label: 'Layer' },
        ],
        default: 'selection',
      },
      {
        key: 'maintainAspect',
        label: 'Lock Aspect Ratio',
        type: 'boolean',
        default: true,
      },
      {
        key: 'interpolation',
        label: 'Interpolation',
        type: 'select',
        options: [
          { value: 'nearest', label: 'Nearest Neighbor' },
          { value: 'bilinear', label: 'Bilinear' },
        ],
        default: 'nearest',
      },
    ],
  },

  rotate: {
    id: 'rotate',
    labelKey: 'sidebar.tools.rotate',
    defaultLabel: 'Rotate',
    icon: IconRegistry.ToolRotate,
    category: 'transform',
    cursor: 'crosshair',
    properties: [
      {
        key: 'rotateAngle',
        label: 'Angle (°)',
        type: 'number',
        min: -360,
        max: 360,
        step: 1,
        default: 0,
      },
      {
        key: 'interpolation',
        label: 'Interpolation',
        type: 'select',
        options: [
          { value: 'nearest', label: 'Nearest Neighbor' },
          { value: 'bilinear', label: 'Bilinear' },
        ],
        default: 'nearest',
      },
    ],
  },

  transform: {
    id: 'transform',
    labelKey: 'sidebar.tools.transform',
    defaultLabel: 'Transform',
    icon: IconRegistry.ToolTransform,
    category: 'transform',
    cursor: 'default',
    properties: [
      {
        key: 'interpolation',
        label: 'Interpolation',
        type: 'select',
        options: [
          { value: 'nearest', label: 'Nearest Neighbor' },
          { value: 'bilinear', label: 'Bilinear' },
        ],
        default: 'nearest',
      },
    ],
  },

  flipHorizontal: {
    id: 'flipHorizontal',
    labelKey: 'sidebar.tools.flipHorizontal',
    defaultLabel: 'Flip Horizontal',
    icon: IconRegistry.ToolFlipHorizontal,
    category: 'transform',
    properties: [
      {
        key: 'flipTarget',
        label: 'Flip',
        type: 'select',
        options: [
          { value: 'selection', label: 'Selection' },
          { value: 'layer', label: 'Layer' },
        ],
        default: 'selection',
      },
    ],
  },

  flipVertical: {
    id: 'flipVertical',
    labelKey: 'sidebar.tools.flipVertical',
    defaultLabel: 'Flip Vertical',
    icon: IconRegistry.ToolFlipVertical,
    category: 'transform',
    properties: [
      {
        key: 'flipTarget',
        label: 'Flip',
        type: 'select',
        options: [
          { value: 'selection', label: 'Selection' },
          { value: 'layer', label: 'Layer' },
        ],
        default: 'selection',
      },
    ],
  },
};

// Helper to get tools by category
export const getToolsByCategory = (category: ToolDefinition['category']): ToolDefinition[] => {
  return Object.values(toolDefinitions).filter((t) => t.category === category);
};

// Helper to get all tool ids
export const getAllToolIds = (): ToolId[] => {
  return Object.keys(toolDefinitions) as ToolId[];
};

// Build default tool properties state from definitions
export const buildDefaultToolProperties = (): Record<ToolId, Record<string, number | string | boolean>> => {
  const defaults: Record<string, Record<string, number | string | boolean>> = {};

  for (const [toolId, def] of Object.entries(toolDefinitions)) {
    defaults[toolId] = {};
    for (const prop of def.properties) {
      defaults[toolId][prop.key] = prop.default;
    }
  }

  return defaults as Record<ToolId, Record<string, number | string | boolean>>;
};
