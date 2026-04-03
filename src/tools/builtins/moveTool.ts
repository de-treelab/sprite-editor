import { registerTool } from '../toolRegistry';
import { movePixels } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'move',
  labelKey: 'sidebar.tools.move',
  defaultLabel: 'Move',
  icon: IconRegistry.ToolMove,
  category: 'transform',
  cursor: 'move',
  mode: 'drag',
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

  onPointerDown(event, ctx) {
    ctx.setCursor('move');
    ctx.dragState.startX = event.x;
    ctx.dragState.startY = event.y;
  },

  onPointerMove(event, ctx) {
    const snapshot = ctx.dragState.snapshot as ImageData | undefined;
    if (!snapshot) return;
    ctx.ctx.putImageData(snapshot, 0, 0);
    const dx = event.x - (ctx.dragState.startX as number);
    const dy = event.y - (ctx.dragState.startY as number);
    movePixels(ctx.ctx, ctx.width, ctx.height, dx, dy, ctx.selectionMask);
    ctx.refreshTexture();
  },
});
