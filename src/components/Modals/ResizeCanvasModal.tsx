import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { Modal, ModalFooter, FormField, NumberInput } from '../ui';
import { useTranslation } from 'react-i18next';

type AnchorX = 0 | 0.5 | 1;
type AnchorY = 0 | 0.5 | 1;
type ResizeMode = 'crop' | 'scale';

interface Props {
  spritesheetId: string;
  animationId: string;
  onClose: () => void;
}

function resizeLayerData(
  oldData: string,
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number,
  mode: ResizeMode,
  anchorX: AnchorX,
  anchorY: AnchorY,
): Promise<string> {
  return new Promise((resolve) => {
    if (!oldData) {
      resolve('');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;

      if (mode === 'scale') {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
      } else {
        // Crop / pad with anchor offset
        const offsetX = Math.round((newWidth - oldWidth) * anchorX);
        const offsetY = Math.round((newHeight - oldHeight) * anchorY);
        ctx.drawImage(img, offsetX, offsetY);
      }

      resolve(canvas.toDataURL());
    };
    img.onerror = () => resolve('');
    img.src = oldData;
  });
}

export const ResizeCanvasModal: React.FC<Props> = ({ spritesheetId, animationId, onClose }) => {
  const { t } = useTranslation();
  const project = useProjectStore((state) => state.project);
  const updateAnimation = useProjectStore((state) => state.updateAnimation);
  const updateLayer = useProjectStore((state) => state.updateLayer);

  const sheet = project?.spritesheets.find((s) => s.id === spritesheetId);
  const anim = sheet?.animations.find((a) => a.id === animationId);
  const currentSize = anim?.canvasSize || project?.defaultCanvasSize || { width: 32, height: 32 };

  const [width, setWidth] = useState(currentSize.width);
  const [height, setHeight] = useState(currentSize.height);
  const [mode, setMode] = useState<ResizeMode>('crop');
  const [anchorX, setAnchorX] = useState<AnchorX>(0.5);
  const [anchorY, setAnchorY] = useState<AnchorY>(0.5);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get all frames referenced by this animation
  const affectedFrameIds = useMemo(() => {
    if (!anim) return new Set<string>();
    return new Set(anim.keyframes.map((k) => k.frameId));
  }, [anim]);

  const handleResize = async () => {
    if (!sheet || !anim || !project) return;
    setIsProcessing(true);

    try {
      // Transform layer data for all affected frames
      for (const frameId of affectedFrameIds) {
        const frame = sheet.frames.find((f) => f.id === frameId);
        if (!frame) continue;

        for (const layer of frame.layers) {
          if (!layer.data) continue;
          const newData = await resizeLayerData(
            layer.data,
            currentSize.width,
            currentSize.height,
            width,
            height,
            mode,
            anchorX,
            anchorY,
          );
          updateLayer(spritesheetId, frameId, layer.id, { data: newData });
        }
      }

      // Update animation canvas size
      updateAnimation(spritesheetId, animationId, { canvasSize: { width, height } });
      onClose();
    } catch (e) {
      console.error('Failed to resize canvas:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const anchorPositions: { x: AnchorX; y: AnchorY }[] = [
    { x: 0, y: 0 },
    { x: 0.5, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 0.5 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1 },
    { x: 0.5, y: 1 },
    { x: 1, y: 1 },
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('resize_modal.title')}
      size="sm"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleResize}
          confirmText={isProcessing ? t('resize_modal.resizing') : t('resize_modal.resize')}
          confirmDisabled={
            isProcessing || width <= 0 || height <= 0 || (width === currentSize.width && height === currentSize.height)
          }
        />
      }
    >
      <p className="text-xs text-slate-400 mb-3">
        {t('resize_modal.current_size')} {currentSize.width} × {currentSize.height} px
        {affectedFrameIds.size > 0 && ` · ${affectedFrameIds.size} ${t('resize_modal.frames_modified')}`}
      </p>

      <div className="flex gap-4">
        <FormField label="Width (px)" className="flex-1">
          <NumberInput value={width} onChange={(e) => setWidth(parseInt(e.target.value) || 1)} min={1} max={4096} />
        </FormField>
        <FormField label="Height (px)" className="flex-1">
          <NumberInput value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 1)} min={1} max={4096} />
        </FormField>
      </div>

      <FormField label={t('resize_modal.mode')}>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              mode === 'crop'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
            onClick={() => setMode('crop')}
          >
            {t('resize_modal.crop_pad')}
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded border transition-colors ${
              mode === 'scale'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
            onClick={() => setMode('scale')}
          >
            {t('common.scale')}
          </button>
        </div>
      </FormField>

      {mode === 'crop' && (
        <FormField label={t('resize_modal.anchor')}>
          <div className="inline-grid grid-cols-3 gap-1">
            {anchorPositions.map(({ x, y }) => {
              const isActive = anchorX === x && anchorY === y;
              return (
                <button
                  key={`${x}-${y}`}
                  className={`w-7 h-7 rounded border transition-colors ${
                    isActive
                      ? 'bg-indigo-500 border-indigo-400'
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => {
                    setAnchorX(x);
                    setAnchorY(y);
                  }}
                  title={`Anchor ${x === 0 ? 'left' : x === 1 ? 'right' : 'center'} ${y === 0 ? 'top' : y === 1 ? 'bottom' : 'middle'}`}
                />
              );
            })}
          </div>
        </FormField>
      )}
    </Modal>
  );
};
