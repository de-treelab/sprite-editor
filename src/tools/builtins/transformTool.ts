import { registerTool } from '../toolRegistry';
import { movePixels } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'transform',
  labelKey: 'sidebar.tools.transform',
  defaultLabel: 'Transform',
  icon: IconRegistry.ToolTransform,
  category: 'transform',
  cursor: 'default',
  mode: 'drag',
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
