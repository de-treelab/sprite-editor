import { registerTool } from '../toolRegistry';
import { IconRegistry } from '../../components/IconRegistry';

registerTool({
  id: 'pan',
  labelKey: 'sidebar.tools.pan',
  defaultLabel: 'Pan',
  icon: IconRegistry.ToolPan,
  category: 'utility',
  cursor: 'grab',
  mode: 'instant',
  properties: [],

  // Pan is handled by the framework (pointerHandlers dispatcher),
  // not by the tool itself. This is a no-op.
  onPointerDown() {},
});
