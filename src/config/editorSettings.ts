import { SettingDefinition } from './settings';

export const editorSettings: SettingDefinition[] = [
  {
    id: 'editor.canvas.zoomStep',
    label: 'Zoom Step',
    category: 'editor.canvas',
    type: 'number',
    default: 10,
    min: 1,
    max: 100,
    step: 1,
  },
];
