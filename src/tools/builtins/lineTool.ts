import { registerTool } from '../toolRegistry';
import { drawLine, BrushShape } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'line',
  labelKey: 'sidebar.tools.line',
  defaultLabel: 'Line',
  icon: IconRegistry.ToolLine,
  category: 'draw',
  cursor: 'crosshair',
  mode: 'preview',
  properties: [{ key: 'brushSize', label: 'Line Width', type: 'number', min: 1, max: 64, step: 1, default: 1 }],

  onPointerDown(event, ctx) {
    ctx.dragState.startX = event.x;
    ctx.dragState.startY = event.y;
  },

  onPointerMove(event, ctx) {
    ctx.clearPreview();
    const thickness = ctx.getProperty<number>('brushSize');
    drawLine(
      ctx.previewCtx,
      ctx.dragState.startX as number,
      ctx.dragState.startY as number,
      event.x,
      event.y,
      ctx.primaryColor,
      thickness,
      'square' as BrushShape,
    );
  },
});
