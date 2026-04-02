import { registerTool } from '../toolRegistry';
import { pickColor } from '../drawingUtils';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'picker',
  labelKey: 'sidebar.tools.picker',
  defaultLabel: 'Color Picker',
  icon: IconRegistry.ToolPicker,
  category: 'utility',
  cursor: 'crosshair',
  mode: 'instant',
  properties: [{ key: 'sampleMerged', label: 'Sample Merged', type: 'boolean', default: false }],

  onPointerDown(event, ctx) {
    const sampleMerged = ctx.getProperty<boolean>('sampleMerged');
    const color = pickColor(ctx.ctx, event.x, event.y, ctx.width, ctx.height, sampleMerged);
    if (color) {
      ctx.setPrimaryColor(color);
    }
  },
});
