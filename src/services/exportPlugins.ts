import type { AtlasMetadata } from './exportService';
import { exportRunPythonPlugin } from './backend';

// ── Plugin interface ──

export interface ExportPlugin {
  id: string;
  name: string;
  description: string;
  fileExtension: string;
  generate: (metadata: AtlasMetadata) => string;
}

// ── Built-in plugins ──

export const genericJsonPlugin: ExportPlugin = {
  id: 'generic-json',
  name: 'Generic JSON',
  description: 'Standard JSON atlas descriptor with frame rects, sizes, and animation timings.',
  fileExtension: '.json',
  generate(metadata) {
    const output = {
      atlas: {
        width: metadata.atlasWidth,
        height: metadata.atlasHeight,
      },
      frames: Object.fromEntries(
        metadata.frames.map(f => [
          f.frameName,
          {
            frame: { x: f.x, y: f.y, w: f.width, h: f.height },
            sourceSize: { w: f.width, h: f.height },
          },
        ]),
      ),
      animations: Object.fromEntries(
        metadata.animations.map(a => [
          a.name,
          {
            canvasSize: { w: a.canvasWidth, h: a.canvasHeight },
            frames: a.keyframes.map(kf => {
              const rect = metadata.frames.find(r => r.frameId === kf.frameId);
              return {
                frame: rect?.frameName ?? kf.frameId,
                time: kf.time,
                duration: kf.duration,
              };
            }),
          },
        ]),
      ),
    };
    return JSON.stringify(output, null, 2);
  },
};

export const godotPlugin: ExportPlugin = {
  id: 'godot-tres',
  name: 'Godot SpriteFrames',
  description: 'Godot .tres resource file for SpriteFrames with atlas texture.',
  fileExtension: '.tres',
  generate(metadata) {
    const lines: string[] = [];
    lines.push('[gd_resource type="SpriteFrames" load_steps=2 format=3]');
    lines.push('');
    lines.push('[ext_resource type="Texture2D" path="res://atlas.png" id="1"]');
    lines.push('');
    lines.push('[resource]');

    const animations = metadata.animations.map(anim => {
      const frames = anim.keyframes.map(kf => {
        const rect = metadata.frames.find(r => r.frameId === kf.frameId);
        if (!rect) return '';
        return `SubResource("AtlasTexture", { "atlas": ExtResource("1"), "region": Rect2(${rect.x}, ${rect.y}, ${rect.width}, ${rect.height}) })`;
      });

      // Calculate FPS from average frame duration
      const avgDuration = anim.keyframes.reduce((sum, kf) => sum + kf.duration, 0) / Math.max(anim.keyframes.length, 1);
      const fps = Math.round(1000 / avgDuration);

      return `{
"name": "${anim.name}",
"speed": ${fps}.0,
"loop": true,
"frames": [${frames.filter(Boolean).map(f => `{ "texture": ${f}, "duration": 1.0 }`).join(', ')}]
}`;
    });

    lines.push(`animations = [${animations.join(', ')}]`);
    return lines.join('\n');
  },
};

export const unityPlugin: ExportPlugin = {
  id: 'unity-json',
  name: 'Unity Sprite Atlas',
  description: 'Unity-compatible JSON atlas descriptor for use with custom importers.',
  fileExtension: '.json',
  generate(metadata) {
    const output = {
      meta: {
        app: 'SpriteEditor',
        version: '1.0',
        image: 'atlas.png',
        size: { w: metadata.atlasWidth, h: metadata.atlasHeight },
      },
      frames: Object.fromEntries(
        metadata.frames.map(f => [
          f.frameName,
          {
            frame: { x: f.x, y: f.y, w: f.width, h: f.height },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: f.width, h: f.height },
            sourceSize: { w: f.width, h: f.height },
            pivot: { x: 0.5, y: 0.5 },
          },
        ]),
      ),
      animations: metadata.animations.map(a => ({
        name: a.name,
        fps: Math.round(
          1000 /
            (a.keyframes.reduce((s, k) => s + k.duration, 0) /
              Math.max(a.keyframes.length, 1)),
        ),
        frames: a.keyframes.map(kf => {
          const rect = metadata.frames.find(r => r.frameId === kf.frameId);
          return rect?.frameName ?? kf.frameId;
        }),
      })),
    };
    return JSON.stringify(output, null, 2);
  },
};

// ── Plugin registry ──

export const builtinPlugins: ExportPlugin[] = [
  genericJsonPlugin,
  godotPlugin,
  unityPlugin,
];

// ── Python plugin runner ──

/**
 * Run a Python plugin script to generate metadata output.
 * The script receives the atlas metadata as JSON on stdin and must
 * write the output format to stdout.
 */
export async function runPythonPlugin(
  scriptPath: string,
  metadata: AtlasMetadata,
): Promise<string> {
  return exportRunPythonPlugin(scriptPath, JSON.stringify(metadata));
}
