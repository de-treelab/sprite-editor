import React, { useState, useEffect } from 'react';
import { gitLoadProjectAtCommit } from '../../services/backend';
import { resolveProjectPath } from '../../services/projectActions';
import type { AppProject, SpriteFrame } from '../../types/project';
import { useTranslation } from 'react-i18next';

interface Props {
  commitHash: string;
  commitMessage: string;
  onClose: () => void;
}

export const VersionPreviewModal: React.FC<Props> = ({ commitHash, commitMessage, onClose }) => {
  const { t } = useTranslation();
  const [project, setProject] = useState<AppProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [selectedAnimId, setSelectedAnimId] = useState<string | null>(null);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const path = resolveProjectPath();
      if (!path) {
        setError('No project path');
        setLoading(false);
        return;
      }
      try {
        const data = await gitLoadProjectAtCommit(path, commitHash);
        const parsed = JSON.parse(data) as AppProject;
        setProject(parsed);
        // Auto-select first spritesheet/animation/frame
        if (parsed.spritesheets.length > 0) {
          const sheet = parsed.spritesheets[0];
          setSelectedSheetId(sheet.id);
          if (sheet.animations.length > 0) {
            setSelectedAnimId(sheet.animations[0].id);
          }
          if (sheet.frames.length > 0) {
            setSelectedFrameId(sheet.frames[0].id);
          }
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [commitHash]);

  const activeSheet = project?.spritesheets.find(s => s.id === selectedSheetId);
  const activeAnim = activeSheet?.animations.find(a => a.id === selectedAnimId);
  const activeFrame = activeSheet?.frames.find(f => f.id === selectedFrameId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-200">{t('version_preview.title')}</h1>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">
            {commitHash}
          </span>
          <span className="text-sm text-slate-400 truncate max-w-md">{commitMessage}</span>
          <span className="text-xs text-orange-400 bg-orange-900/20 px-2 py-0.5 rounded">
            {t('version_preview.readonly_badge')}
          </span>
        </div>
        <button
          className="text-slate-400 hover:text-white px-4 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
          onClick={onClose}
        >
          {t('version_preview.close')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="w-6 h-6 border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin mr-3" />
            {t('version_preview.loading')}
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center text-red-400">
            {t('version_preview.load_error')}{error}
          </div>
        )}

        {!loading && !error && project && (
          <>
            {/* Left sidebar - navigation */}
            <div className="w-64 border-r border-slate-700 bg-slate-800/50 overflow-y-auto">
              <div className="p-3 border-b border-slate-700">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</h2>
                <p className="text-sm text-slate-200 mt-1">{project.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {project.defaultCanvasSize.width}×{project.defaultCanvasSize.height}px
                </p>
              </div>

              {/* Spritesheets */}
              {project.spritesheets.map(sheet => (
                <div key={sheet.id} className="border-b border-slate-700/50">
                  <button
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${selectedSheetId === sheet.id ? 'bg-slate-700/50 text-white' : 'text-slate-300'}`}
                    onClick={() => {
                      setSelectedSheetId(sheet.id);
                      if (sheet.animations.length > 0) setSelectedAnimId(sheet.animations[0].id);
                      if (sheet.frames.length > 0) setSelectedFrameId(sheet.frames[0].id);
                    }}
                  >
                    <span className="font-medium">{sheet.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {sheet.frames.length} frames, {sheet.animations.length} anims
                    </span>
                  </button>

                  {selectedSheetId === sheet.id && (
                    <div className="pl-4">
                      {/* Animations */}
                      <div className="px-2 py-1">
                        <span className="text-xs text-slate-500 uppercase">Animations</span>
                      </div>
                      {sheet.animations.map(anim => (
                        <button
                          key={anim.id}
                          className={`w-full text-left px-3 py-1 text-xs hover:bg-slate-700/50 ${selectedAnimId === anim.id ? 'text-indigo-400' : 'text-slate-400'}`}
                          onClick={() => setSelectedAnimId(anim.id)}
                        >
                          {anim.name} ({anim.keyframes.length} keyframes)
                        </button>
                      ))}

                      {/* Frames */}
                      <div className="px-2 py-1 mt-1">
                        <span className="text-xs text-slate-500 uppercase">Frames</span>
                      </div>
                      {sheet.frames.map((frame, idx) => (
                        <button
                          key={frame.id}
                          className={`w-full text-left px-3 py-1 text-xs hover:bg-slate-700/50 ${selectedFrameId === frame.id ? 'text-indigo-400' : 'text-slate-400'}`}
                          onClick={() => setSelectedFrameId(frame.id)}
                        >
                          Frame {idx + 1} ({frame.layers.length} layers)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Palettes */}
              {project.palettes.length > 0 && (
                <div className="p-3">
                  <span className="text-xs text-slate-500 uppercase">Palettes</span>
                  {project.palettes.map(p => (
                    <div key={p.id} className="mt-2">
                      <p className="text-xs text-slate-300">{p.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.colors.map((c, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-sm border border-slate-600"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main area - frame preview */}
            <div className="flex-1 flex flex-col">
              {/* Animation details */}
              {activeAnim && (
                <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
                  <span className="text-sm text-slate-200 font-medium">{activeAnim.name}</span>
                  <span className="text-xs text-slate-500 ml-2">
                    {activeAnim.keyframes.length} keyframes
                    {activeAnim.canvasSize && ` • ${activeAnim.canvasSize.width}×${activeAnim.canvasSize.height}px`}
                  </span>

                  {/* Keyframe timeline bar */}
                  <div className="flex gap-1 mt-2">
                    {activeAnim.keyframes
                      .sort((a, b) => a.time - b.time)
                      .map((kf) => (
                        <button
                          key={kf.id}
                          className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                            selectedFrameId === kf.frameId
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                          }`}
                          onClick={() => setSelectedFrameId(kf.frameId)}
                        >
                          {kf.time}ms
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Frame canvas preview */}
              <div className="flex-1 flex items-center justify-center p-4 bg-[repeating-conic-gradient(#374151_0%_25%,#1e293b_0%_50%)] bg-[length:16px_16px]">
                {activeFrame ? (
                  <FramePreview
                    frame={activeFrame}
                    canvasSize={activeAnim?.canvasSize ?? project.defaultCanvasSize}
                  />
                ) : (
                  <p className="text-slate-500 text-sm">{t('canvas.select_frame_preview')}</p>
                )}
              </div>

              {/* Layers panel */}
              {activeFrame && (
                <div className="h-40 border-t border-slate-700 bg-slate-800/50 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-slate-700/50">
                    <span className="text-xs text-slate-400 uppercase font-semibold">
                      Layers ({activeFrame.layers.length})
                    </span>
                  </div>
                  {activeFrame.layers.map((layer) => (
                    <div
                      key={layer.id}
                      className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-700/30 text-xs"
                    >
                      <span className={`w-2 h-2 rounded-full ${layer.visible ? 'bg-green-500' : 'bg-slate-600'}`} />
                      <span className="text-slate-300 flex-1">{layer.name}</span>
                      <span className="text-slate-500">{Math.round(layer.opacity * 100)}%</span>
                      <span className="text-slate-600">{layer.blendMode}</span>
                      {layer.locked && <span className="text-yellow-500">🔒</span>}
                      {layer.isReference && <span className="text-blue-400 text-[10px]">REF</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Frame preview subcomponent ──

const FramePreview: React.FC<{
  frame: SpriteFrame;
  canvasSize: { width: number; height: number };
}> = ({ frame, canvasSize }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scale = Math.min(
      Math.min(600, window.innerWidth * 0.5) / canvasSize.width,
      Math.min(400, window.innerHeight * 0.4) / canvasSize.height,
      8,
    );
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    canvas.style.width = `${canvasSize.width * scale}px`;
    canvas.style.height = `${canvasSize.height * scale}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers bottom to top
    const drawLayers = async () => {
      for (const layer of frame.layers) {
        if (!layer.visible || layer.isReference || !layer.data) continue;

        const img = await loadImage(layer.data);
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = blendToComposite(layer.blendMode);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      }
    };
    drawLayers();
  }, [frame, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-slate-600 shadow-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function blendToComposite(mode: string): GlobalCompositeOperation {
  switch (mode) {
    case 'multiply': return 'multiply';
    case 'screen': return 'screen';
    case 'overlay': return 'overlay';
    default: return 'source-over';
  }
}
