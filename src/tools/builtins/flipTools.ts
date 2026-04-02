import { registerTool } from '../toolRegistry';
import { flipHorizontal, flipVertical } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'flipHorizontal',
  labelKey: 'sidebar.tools.flipHorizontal',
  defaultLabel: 'Flip Horizontal',
  icon: IconRegistry.ToolFlipHorizontal,
  category: 'transform',
  mode: 'instant',
  properties: [
    {
      key: 'flipTarget',
      label: 'Flip',
      type: 'select',
      options: [
        { value: 'selection', label: 'Selection' },
        { value: 'layer', label: 'Layer' },
      ],
      default: 'selection',
    },
  ],

  onPointerDown(_event, ctx) {
    const snapshot = ctx.captureSnapshot();
    flipHorizontal(ctx.ctx, ctx.width, ctx.height, ctx.selectionMask);
    ctx.refreshTexture();
    ctx.commit('Flip horizontal', snapshot);
  },
});

registerTool({
  id: 'flipVertical',
  labelKey: 'sidebar.tools.flipVertical',
  defaultLabel: 'Flip Vertical',
  icon: IconRegistry.ToolFlipVertical,
  category: 'transform',
  mode: 'instant',
  properties: [
    {
      key: 'flipTarget',
      label: 'Flip',
      type: 'select',
      options: [
        { value: 'selection', label: 'Selection' },
        { value: 'layer', label: 'Layer' },
      ],
      default: 'selection',
    },
  ],

  onPointerDown(_event, ctx) {
    const snapshot = ctx.captureSnapshot();
    flipVertical(ctx.ctx, ctx.width, ctx.height, ctx.selectionMask);
    ctx.refreshTexture();
    ctx.commit('Flip vertical', snapshot);
  },
});
