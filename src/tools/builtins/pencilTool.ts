import { registerTool } from '../toolRegistry';
import { drawBrush, BrushShape } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'pencil',
  labelKey: 'sidebar.tools.pencil',
  defaultLabel: 'Pencil',
  icon: IconRegistry.ToolPencil,
  category: 'draw',
  cursor: 'crosshair',
  mode: 'drag',
  properties: [
    { key: 'brushSize', label: 'Brush Size', type: 'number', min: 1, max: 64, step: 1, default: 1 },
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

  onPointerDown(event, ctx) {
    const size = ctx.getProperty<number>('brushSize');
    const shape = ctx.getProperty<string>('brushShape') as BrushShape;
    drawBrush(ctx.ctx, event.x, event.y, size, shape, ctx.primaryColor, false);
    ctx.refreshTexture();
    ctx.dragState.lastX = event.x;
    ctx.dragState.lastY = event.y;
  },

  onPointerMove(event, ctx) {
    const size = ctx.getProperty<number>('brushSize');
    const shape = ctx.getProperty<string>('brushShape') as BrushShape;
    const lastX = ctx.dragState.lastX as number;
    const lastY = ctx.dragState.lastY as number;

    const dx = Math.abs(event.x - lastX);
    const dy = Math.abs(event.y - lastY);
    const sx = lastX < event.x ? 1 : -1;
    const sy = lastY < event.y ? 1 : -1;
    let err = dx - dy;
    let cx = lastX,
      cy = lastY;
    while (true) {
      drawBrush(ctx.ctx, cx, cy, size, shape, ctx.primaryColor, false);
      if (cx === event.x && cy === event.y) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }

    ctx.dragState.lastX = event.x;
    ctx.dragState.lastY = event.y;
    ctx.refreshTexture();
  },
});
