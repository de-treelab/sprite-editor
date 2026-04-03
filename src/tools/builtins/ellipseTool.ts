import { registerTool } from '../toolRegistry';
import { drawEllipse } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'ellipse',
  labelKey: 'sidebar.tools.ellipse',
  defaultLabel: 'Ellipse',
  icon: IconRegistry.ToolEllipse,
  category: 'draw',
  cursor: 'crosshair',
  mode: 'preview',
  properties: [
    { key: 'brushSize', label: 'Stroke Width', type: 'number', min: 1, max: 64, step: 1, default: 1 },
    { key: 'filled', label: 'Filled', type: 'boolean', default: false },
  ],

  onPointerDown(event, ctx) {
    ctx.dragState.startX = event.x;
    ctx.dragState.startY = event.y;
  },

  onPointerMove(event, ctx) {
    ctx.clearPreview();
    const filled = ctx.getProperty<boolean>('filled');
    const strokeWidth = ctx.getProperty<number>('brushSize');
    drawEllipse(
      ctx.previewCtx,
      ctx.dragState.startX as number,
      ctx.dragState.startY as number,
      event.x,
      event.y,
      ctx.primaryColor,
      filled,
      strokeWidth,
    );
  },
});
