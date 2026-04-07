import { useRef, useEffect, useCallback } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { usePalette } from '@/hooks/usePalette';
import { compositeFrame } from '@/lib/layerUtils';

const GRID_GAP = 1;
const LABEL_WIDTH_BASE = 55;
const CHECKER_SIZE_BASE = 4;

interface SpriteSheetCanvasProps {
  asset: SpriteAsset;
  scale?: number;
  showLabels?: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  checkerSize: number
) {
  const c1 = '#0a0a14';
  const c2 = '#121220';
  for (let cy = 0; cy < h; cy += checkerSize) {
    for (let cx = 0; cx < w; cx += checkerSize) {
      const isEven = ((cx / checkerSize) + (cy / checkerSize)) % 2 === 0;
      ctx.fillStyle = isEven ? c1 : c2;
      ctx.fillRect(x + cx, y + cy, checkerSize, checkerSize);
    }
  }
}

export default function SpriteSheetCanvas({ 
  asset, 
  scale = 4, 
  showLabels: showLabelsProp = true,
  onCanvasReady 
}: SpriteSheetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = usePalette();

  const CELL_SIZE = asset.size * scale;
  const hasAnimations = asset.animations && asset.animations.length > 0;
  const checkerSize = Math.max(2, Math.floor(CHECKER_SIZE_BASE * (scale / 4)));

  // Calculate grid dimensions
  let rows: { label: string; frameIndices: number[] }[];

  if (hasAnimations) {
    rows = asset.animations.map(a => ({
      label: a.label,
      frameIndices: a.frameIndices,
    }));
  } else {
    // Static: show all frames or just the first few
    const frameCount = asset.layers?.[0]?.frames.length ?? asset.frames?.length ?? 1;
    // Limit static preview to 4 frames to avoid infinite horizontal cards
    const previewCount = Math.min(4, frameCount);
    rows = [{
      label: 'BASE',
      frameIndices: Array.from({ length: previewCount }, (_, i) => i),
    }];
  }

  const maxCols = Math.max(...rows.map(r => r.frameIndices.length));
  // Force labels if requested, unless the asset is purely static with 1 frame
  const effectiveShowLabels = showLabelsProp;
  const labelW = effectiveShowLabels ? (LABEL_WIDTH_BASE * Math.max(0.8, scale / 4)) : 0;

  const totalWidth = labelW + maxCols * (CELL_SIZE + GRID_GAP) + GRID_GAP;
  const totalHeight = rows.length * (CELL_SIZE + GRID_GAP) + GRID_GAP;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Main background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Label column background highlight
    if (effectiveShowLabels) {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, labelW, totalHeight);
      ctx.strokeStyle = '#22c55e33'; // Faint emerald border
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(labelW - 0.5, 0);
      ctx.lineTo(labelW - 0.5, totalHeight);
      ctx.stroke();
    }

    rows.forEach((row, rowIdx) => {
      const y = GRID_GAP + rowIdx * (CELL_SIZE + GRID_GAP);

      // Draw row label
      if (effectiveShowLabels) {
        ctx.fillStyle = '#4ade80'; // Emerald-400
        const fontSize = Math.max(6, Math.floor(7 * (scale / 4)));
        // Use a standard pixel-friendly font stack if Press Start 2P fails
        ctx.font = `${fontSize}px "Press Start 2P", "Courier New", monospace`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(row.label.toUpperCase(), 6, y + CELL_SIZE / 2);
      }

      // Draw each frame in this row
      row.frameIndices.forEach((frameIdx, colIdx) => {
        const x = labelW + GRID_GAP + colIdx * (CELL_SIZE + GRID_GAP);
        drawCheckerboard(ctx, x, y, CELL_SIZE, CELL_SIZE, checkerSize);
        
        ctx.strokeStyle = '#1e1e2e';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        const frame = asset.layers && asset.layers.length > 0 
          ? compositeFrame(asset, frameIdx) 
          : (asset.frames?.[frameIdx] || null);
          
        if (!frame) return;

        for (let fRow = 0; fRow < asset.size; fRow++) {
          for (let fCol = 0; fCol < asset.size; fCol++) {
            const val = frame[fRow][fCol];
            if (!val || val === 0) continue;
            const color = palette[val];
            if (!color || color === 'transparent') continue;
            ctx.fillStyle = color;
            ctx.fillRect(
              x + fCol * scale,
              y + fRow * scale,
              scale,
              scale
            );
          }
        }
      });
    });

    onCanvasReady?.(canvas);
  }, [asset, palette, onCanvasReady, rows, CELL_SIZE, labelW, effectiveShowLabels, scale, checkerSize, totalHeight]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={totalWidth}
      height={totalHeight}
      className="rounded-sm shadow-2xl border border-white/5"
      style={{ imageRendering: 'pixelated', width: totalWidth, height: totalHeight }}
    />
  );
}
