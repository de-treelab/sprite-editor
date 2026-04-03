// Registers all built-in views with the layout system.
// Call this once at app startup (e.g. in main.tsx).
import { registerView } from './viewRegistry';
import { IconRegistry } from '../components/IconRegistry';

// Lazy-load view components to avoid circular imports
import { ProjectNavigator } from '../components/Sidebar/ProjectNavigator';
import { Sidebar as ToolbarView } from '../components/Sidebar/Sidebar';
import { CanvasView } from '../components/Canvas/CanvasView';
import { RightSidebarLayers } from '../components/Sidebar/LayersView';
import { ToolProperties } from '../components/Sidebar/ToolProperties';
import { OnionSkinPanel } from '../components/Sidebar/OnionSkinPanel';
import { ColorPalettePanel } from '../components/Sidebar/ColorPalettePanel';
import { TimelineView } from '../components/Timeline/TimelineView';
import { PreviewView } from '../components/Preview/PreviewView';

export function registerBuiltinViews(): void {
  registerView({
    id: 'navigator',
    title: 'Navigator',
    icon: IconRegistry.Folder,
    component: ProjectNavigator,
    defaultLocation: 'left',
  });

  registerView({
    id: 'toolbar',
    title: 'Toolbar',
    icon: IconRegistry.ToolPencil,
    component: ToolbarView,
    defaultLocation: 'left',
  });

  registerView({
    id: 'canvas',
    title: 'Canvas',
    icon: IconRegistry.Image,
    component: CanvasView,
    defaultLocation: 'center',
    singleton: true,
  });

  registerView({
    id: 'layers',
    title: 'Layers',
    icon: IconRegistry.ArrowUp,
    component: RightSidebarLayers,
    defaultLocation: 'right',
  });

  registerView({
    id: 'tool-properties',
    title: 'Tool Properties',
    icon: IconRegistry.Settings,
    component: ToolProperties,
    defaultLocation: 'right',
  });

  registerView({
    id: 'onion-skin',
    title: 'Onion Skin',
    icon: IconRegistry.VisibleOn,
    component: OnionSkinPanel,
    defaultLocation: 'right',
  });

  registerView({
    id: 'color-palette',
    title: 'Color Palette',
    icon: IconRegistry.Palette,
    component: ColorPalettePanel,
    defaultLocation: 'right',
  });

  registerView({
    id: 'timeline',
    title: 'Timeline',
    icon: IconRegistry.Play,
    component: TimelineView,
    defaultLocation: 'bottom',
  });

  registerView({
    id: 'preview',
    title: 'Preview',
    icon: IconRegistry.Play,
    component: PreviewView,
    defaultLocation: 'right',
  });
}
