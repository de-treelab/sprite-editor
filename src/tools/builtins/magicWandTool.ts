import { registerTool } from '../toolRegistry';
import { createMagicWandSelection, combineSelections, isSelectionEmpty } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'magicWand',
  labelKey: 'sidebar.tools.magicWand',
  defaultLabel: 'Magic Wand',
  icon: IconRegistry.ToolMagicWand,
  category: 'select',
  cursor: 'crosshair',
  mode: 'instant',
  properties: [
    { key: 'tolerance', label: 'Tolerance', type: 'number', min: 0, max: 255, step: 1, default: 32 },
    { key: 'contiguous', label: 'Contiguous', type: 'boolean', default: true },
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

  onPointerDown(event, ctx) {
    const tolerance = ctx.getProperty<number>('tolerance');
    const selectionMode = ctx.getProperty<string>('selectionMode') as 'replace' | 'add' | 'subtract' | 'intersect';
    const contiguous = ctx.getProperty<boolean>('contiguous');
    const newMask = createMagicWandSelection(ctx.ctx, event.x, event.y, tolerance, contiguous, ctx.width, ctx.height);
    const combined = combineSelections(ctx.selectionMask, newMask, selectionMode);
    ctx.setSelectionMask(isSelectionEmpty(combined) ? null : combined);
    ctx.redrawSelection();
  },
});
