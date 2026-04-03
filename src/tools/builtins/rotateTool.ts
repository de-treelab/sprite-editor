import { registerTool } from '../toolRegistry';
import { rotateByArbitraryAngle } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'rotate',
  labelKey: 'sidebar.tools.rotate',
  defaultLabel: 'Rotate',
  icon: IconRegistry.ToolRotate,
  category: 'transform',
  cursor: 'crosshair',
  mode: 'drag',
  properties: [
    { key: 'rotateAngle', label: 'Angle (°)', type: 'number', min: -360, max: 360, step: 1, default: 0 },
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
    ctx.dragState.startX = event.x;
  },

  onPointerMove(event, ctx) {
    const snapshot = ctx.dragState.snapshot as ImageData | undefined;
    if (!snapshot) return;
    ctx.ctx.putImageData(snapshot, 0, 0);
    const dx = event.x - (ctx.dragState.startX as number);
    const angle = dx * 2;
    const interpolation = ctx.getProperty<string>('interpolation') as 'nearest' | 'bilinear';
    rotateByArbitraryAngle(ctx.ctx, ctx.width, ctx.height, angle, interpolation, ctx.selectionMask);
    ctx.refreshTexture();
  },
});
