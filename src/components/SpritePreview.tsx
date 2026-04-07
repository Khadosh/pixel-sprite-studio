import { useRef, useEffect } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { usePalette } from '@/hooks/usePalette';
import { useAssetPreview } from '@/hooks/useAssetPreview';

const PREVIEW_SCALE = 6;

interface SpritePreviewProps {
  asset: SpriteAsset;
  animationName?: string | null;
  scale?: number;
  showLabel?: boolean;
  currentFrameOverride?: number[][];
}

export default function SpritePreview({ 
  asset, 
  animationName = null, 
  scale = 6,
  showLabel = true,
  currentFrameOverride
}: SpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = usePalette();
  const previewState = useAssetPreview(asset, animationName);
  const currentFrame = currentFrameOverride || previewState.currentFrame;
  const { currentAnimation } = previewState;

  const PREVIEW_SIZE = asset.size * scale;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Draw checkerboard background
    const cs = Math.max(4, Math.floor(PREVIEW_SIZE / 8));
    for (let y = 0; y < PREVIEW_SIZE; y += cs) {
      for (let x = 0; x < PREVIEW_SIZE; x += cs) {
        const isEven = ((x / cs) + (y / cs)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1e1e2e' : '#252538';
        ctx.fillRect(x, y, cs, cs);
      }
    }

    // Draw sprite
    if (currentFrame) {
      for (let row = 0; row < asset.size; row++) {
        for (let col = 0; col < asset.size; col++) {
          const val = currentFrame[row]?.[col];
          if (!val || val === 0) continue;
          const color = palette?.[val];
          if (!color || color === 'transparent') continue;
          ctx.fillStyle = color;
          ctx.fillRect(col * scale, row * scale, scale, scale);
        }
      }
    }
  }, [asset, currentFrame, palette, PREVIEW_SIZE, scale]);

  const label = currentAnimation?.label ?? 'STATIC';

  return (
    <div className="flex flex-col items-center gap-2">
      {showLabel && (
        <div className="text-[10px] font-pixel text-primary tracking-wider uppercase opacity-70">
          Preview · {label}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        className="rounded border border-border bg-black/20 shadow-inner"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
