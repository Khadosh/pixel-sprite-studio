import { useRef, useEffect } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { usePalette } from '@/hooks/usePalette';
import { useAssetPreview } from '@/hooks/useAssetPreview';

const PREVIEW_SCALE = 6;

interface SpritePreviewProps {
  asset: SpriteAsset;
}

export default function SpritePreview({ asset }: SpritePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = usePalette();
  const {
    currentFrame,
    currentAnimation,
    animationIndex,
    setAnimationIndex,
    hasAnimations,
  } = useAssetPreview(asset);

  const PREVIEW_SIZE = asset.size * PREVIEW_SCALE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    // Draw checkerboard background
    const cs = 12;
    for (let y = 0; y < PREVIEW_SIZE; y += cs) {
      for (let x = 0; x < PREVIEW_SIZE; x += cs) {
        const isEven = ((x / cs) + (y / cs)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1e1e2e' : '#252538';
        ctx.fillRect(x, y, cs, cs);
      }
    }

    // Draw sprite
    for (let row = 0; row < asset.size; row++) {
      for (let col = 0; col < asset.size; col++) {
        const val = currentFrame[row][col];
        if (val === 0) continue;
        const color = palette[val];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * PREVIEW_SCALE, row * PREVIEW_SCALE, PREVIEW_SCALE, PREVIEW_SCALE);
      }
    }
  }, [asset, currentFrame, palette, PREVIEW_SIZE]);

  const label = currentAnimation?.label ?? 'STATIC';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm font-pixel text-primary tracking-wider">
        PREVIEW — {label}
      </div>
      <canvas
        ref={canvasRef}
        width={PREVIEW_SIZE}
        height={PREVIEW_SIZE}
        className="rounded border border-border"
        style={{ imageRendering: 'pixelated' }}
      />
      {hasAnimations && (
        <div className="flex flex-wrap gap-2">
          {asset.animations.map((a, i) => (
            <button
              key={a.name}
              onClick={() => setAnimationIndex(i)}
              className={`px-3 py-1.5 text-[10px] font-pixel rounded border transition-colors ${
                i === animationIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
