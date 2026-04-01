export interface AppProject {
  id: string;
  name: string;
  defaultCanvasSize: { width: number; height: number };
  palettes: ProjectPalette[];
  spritesheets: Spritesheet[];
}

export interface ProjectPalette {
  id: string;
  name: string;
  colors: string[]; // hex strings
}

export interface Spritesheet {
  id: string;
  name: string;
  animations: Animation[];
  images: ReferenceImage[];
  frames: SpriteFrame[];
}

export interface Animation {
  id: string;
  name: string;
  canvasSize?: { width: number; height: number }; // Defaults to project definition
  keyframes: Keyframe[];
}

export interface ReferenceImage {
  id: string;
  name: string;
  canvasSize?: { width: number; height: number };
  frameId: string;
}

export type ActiveItemType = 'animation' | 'image';

export interface Keyframe {
  id: string;
  time: number; // Start time in ms
  frameId: string; // The frame to display
}

export interface SpriteFrame {
  id: string;
  layers: Layer[];
}

export interface Layer {
  id: string;
  name: string;
  opacity: number; // 0.0 to 1.0
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'; 
  visible: boolean;
  locked: boolean;
  isReference: boolean;
  // This will store pixel data. Base64 string for simplicity in persistence right now
  data: string;
}
