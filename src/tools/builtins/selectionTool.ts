import { registerTool } from '../toolRegistry';
import { createRectSelection, createEllipseSelection, combineSelections, isSelectionEmpty } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'selection',
  labelKey: 'sidebar.tools.selection',
  defaultLabel: 'Rectangle Select',
  icon: IconRegistry.ToolSelect,
  category: 'select',
  cursor: 'crosshair',
  mode: 'selection',
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

  onPointerDown(event, ctx) {
    ctx.dragState.startX = event.x;
    ctx.dragState.startY = event.y;
    ctx.dragState.lastX = event.x;
    ctx.dragState.lastY = event.y;
  },

  onPointerMove(event, ctx) {
    const selectionShape = ctx.getProperty<string>('selectionShape');
    const startX = ctx.dragState.startX as number;
    const startY = ctx.dragState.startY as number;

    ctx.selectionGraphics.clear();
    if (selectionShape === 'ellipse') {
      const cx = (startX + event.x) / 2;
      const cy = (startY + event.y) / 2;
      const rx = Math.abs(event.x - startX) / 2;
      const ry = Math.abs(event.y - startY) / 2;
      ctx.selectionGraphics.ellipse(cx, cy, rx, ry);
    } else {
      const rx = Math.min(startX, event.x);
      const ry = Math.min(startY, event.y);
      const rw = Math.abs(event.x - startX);
      const rh = Math.abs(event.y - startY);
      ctx.selectionGraphics.rect(rx, ry, rw, rh);
    }
    ctx.selectionGraphics.stroke({ width: 1 / ctx.viewportScale, color: 0x000000, pixelLine: true });
    ctx.dragState.lastX = event.x;
    ctx.dragState.lastY = event.y;
  },

  onPointerUp(_event, ctx) {
    const selectionShape = ctx.getProperty<string>('selectionShape');
    const selectionMode = ctx.getProperty<string>('selectionMode') as 'replace' | 'add' | 'subtract' | 'intersect';
    const startX = ctx.dragState.startX as number;
    const startY = ctx.dragState.startY as number;
    const lastX = ctx.dragState.lastX as number;
    const lastY = ctx.dragState.lastY as number;

    const newMask =
      selectionShape === 'ellipse'
        ? createEllipseSelection(startX, startY, lastX, lastY, ctx.width, ctx.height)
        : createRectSelection(startX, startY, lastX, lastY, ctx.width, ctx.height);
    const combined = combineSelections(ctx.selectionMask, newMask, selectionMode);
    ctx.setSelectionMask(isSelectionEmpty(combined) ? null : combined);
    ctx.redrawSelection();
  },
});
