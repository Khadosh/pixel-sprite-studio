import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SpriteAsset } from '@/lib/types';
import { useAssetPreview } from '@/hooks/useAssetPreview';

const CARD_PIXEL_SCALE = 4;
const CHECKER_SIZE = 8;

const CATEGORY_COLORS: Record<string, string> = {
  character: '#22c55e',
  terrain:   '#3b82f6',
  prop:      '#f59e0b',
  nature:    '#10b981',
  ui:        '#a855f7',
};

const CATEGORY_LABELS: Record<string, string> = {
  character: 'Character',
  terrain:   'Terrain',
  prop:      'Prop',
  nature:    'Nature',
  ui:        'UI',
};

interface AssetCardProps {
  asset: SpriteAsset;
  projectId?: string;
}

export default function AssetCard({ asset, projectId }: AssetCardProps) {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentFrame } = useAssetPreview(asset);

  const canvasSize = asset.size * CARD_PIXEL_SCALE;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw checkerboard background
    for (let y = 0; y < canvasSize; y += CHECKER_SIZE) {
      for (let x = 0; x < canvasSize; x += CHECKER_SIZE) {
        const isEven = ((x / CHECKER_SIZE) + (y / CHECKER_SIZE)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1a1a2e' : '#22223a';
        ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
      }
    }

    // Draw sprite
    for (let row = 0; row < asset.size; row++) {
      for (let col = 0; col < asset.size; col++) {
        const val = currentFrame[row][col];
        if (val === 0) continue;
        const color = asset.palette[val];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          col * CARD_PIXEL_SCALE,
          row * CARD_PIXEL_SCALE,
          CARD_PIXEL_SCALE,
          CARD_PIXEL_SCALE
        );
      }
    }
  }, [asset, currentFrame, canvasSize]);

  const categoryColor = CATEGORY_COLORS[asset.category] ?? '#888';

  return (
    <button
      id={`asset-card-${asset.id}`}
      onClick={() => {
        const query = projectId ? `?projectId=${projectId}` : '';
        navigate(`/asset/${asset.id}${query}`);
      }}
      className="group w-full text-left bg-card rounded-lg border border-border hover:border-primary/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden cursor-pointer"
    >
      {/* Preview canvas */}
      <div className="flex items-center justify-center p-4 pb-3">
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className="rounded border border-border/50 group-hover:border-primary/30 transition-colors"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Info */}
      <div className="px-4 pb-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="font-pixel text-[10px] text-foreground tracking-wider group-hover:text-primary transition-colors">
            {asset.name.toUpperCase()}
          </h3>
          <span
            className="inline-flex items-center px-2 py-0.5 text-[8px] font-pixel rounded-full border"
            style={{
              color: categoryColor,
              borderColor: `${categoryColor}40`,
              backgroundColor: `${categoryColor}10`,
            }}
          >
            {CATEGORY_LABELS[asset.category]}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono leading-relaxed line-clamp-2">
          {asset.description}
        </p>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[8px] text-muted-foreground font-mono">
            {asset.size}×{asset.size}px
          </span>
          <span className="text-[8px] text-muted-foreground">•</span>
          <span className="text-[8px] text-muted-foreground font-mono">
            {asset.frames.length} frame{asset.frames.length !== 1 ? 's' : ''}
          </span>
          {asset.animations.length > 0 && (
            <>
              <span className="text-[8px] text-muted-foreground">•</span>
              <span className="text-[8px] text-muted-foreground font-mono">
                {asset.animations.length} anim{asset.animations.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
