import { registerTool } from '../toolRegistry';
import { floodFill } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'fill',
  labelKey: 'sidebar.tools.fill',
  defaultLabel: 'Fill',
  icon: IconRegistry.ToolFill,
  category: 'draw',
  cursor: 'crosshair',
  mode: 'instant',
  properties: [
    { key: 'tolerance', label: 'Tolerance', type: 'number', min: 0, max: 255, step: 1, default: 0 },
    { key: 'contiguous', label: 'Contiguous', type: 'boolean', default: true },
  ],

  onPointerDown(event, ctx) {
    const snapshot = ctx.captureSnapshot();
    const tolerance = ctx.getProperty<number>('tolerance');
    const contiguous = ctx.getProperty<boolean>('contiguous');
    floodFill(ctx.ctx, event.x, event.y, ctx.primaryColor, tolerance, contiguous, ctx.width, ctx.height);
    ctx.refreshTexture();
    ctx.commit('Fill', snapshot);
  },
});
