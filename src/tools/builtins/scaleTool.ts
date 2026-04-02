import { registerTool } from '../toolRegistry';
import { scalePixels } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'scale',
  labelKey: 'sidebar.tools.scale',
  defaultLabel: 'Scale',
  icon: IconRegistry.ToolScale,
  category: 'transform',
  cursor: 'nwse-resize',
  mode: 'drag',
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
    { key: 'maintainAspect', label: 'Lock Aspect Ratio', type: 'boolean', default: true },
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
    ctx.setCursor('nwse-resize');
    ctx.dragState.startX = event.x;
    ctx.dragState.startY = event.y;
  },

  onPointerMove(event, ctx) {
    const snapshot = ctx.dragState.snapshot as ImageData | undefined;
    if (!snapshot) return;
    ctx.ctx.putImageData(snapshot, 0, 0);

    const startX = ctx.dragState.startX as number;
    const startY = ctx.dragState.startY as number;
    const dx = event.x - startX;
    const dy = event.y - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const sign = dx + dy >= 0 ? 1 : -1;
    const scaleFactor = Math.max(0.1, 1 + (sign * distance) / 50);
    const maintainAspect = ctx.getProperty<boolean>('maintainAspect');
    const interpolation = ctx.getProperty<string>('interpolation') as 'nearest' | 'bilinear';
    const sx = scaleFactor;
    const sy = maintainAspect ? scaleFactor : Math.max(0.1, 1 + dy / 50);
    scalePixels(ctx.ctx, ctx.width, ctx.height, sx, sy, interpolation, ctx.selectionMask);
    ctx.refreshTexture();
  },
});
