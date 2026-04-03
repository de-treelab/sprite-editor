// Central registry of all application settings
import { SettingDefinition } from './settings';
import { keybindingSettings } from './keybindingSettings';
import { gitSettings } from './gitSettings';
import { editorSettings } from './editorSettings';

// All registered settings — extend this array as new settings are added
export const allSettings: SettingDefinition[] = [...keybindingSettings, ...gitSettings, ...editorSettings];
