import { useRef, useEffect, useCallback } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { usePalette } from '@/hooks/usePalette';

const PIXEL_SCALE = 4;
const GRID_GAP = 2;
const LABEL_WIDTH = 80;
const CHECKER_SIZE = 8;

interface SpriteSheetCanvasProps {
  asset: SpriteAsset;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  const c1 = '#1e1e2e';
  const c2 = '#252538';
  for (let cy = 0; cy < h; cy += CHECKER_SIZE) {
    for (let cx = 0; cx < w; cx += CHECKER_SIZE) {
      const isEven = ((cx / CHECKER_SIZE) + (cy / CHECKER_SIZE)) % 2 === 0;
      ctx.fillStyle = isEven ? c1 : c2;
      ctx.fillRect(x + cx, y + cy, CHECKER_SIZE, CHECKER_SIZE);
    }
  }
}

/**
 * Renders a sprite sheet grid for any SpriteAsset.
 * - For animated assets: rows = animations, cols = frames per animation
 * - For static assets: single frame displayed
 */
export default function SpriteSheetCanvas({ asset, onCanvasReady }: SpriteSheetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette } = usePalette();

  const CELL_SIZE = asset.size * PIXEL_SCALE;
  const hasAnimations = asset.animations.length > 0;

  // Calculate grid dimensions
  let rows: { label: string; frameIndices: number[] }[];

  if (hasAnimations) {
    rows = asset.animations.map(a => ({
      label: a.label,
      frameIndices: a.frameIndices,
    }));
  } else {
    // Static: show all frames in a single row
    rows = [{
      label: asset.name.toUpperCase(),
      frameIndices: asset.frames.map((_, i) => i),
    }];
  }

  const maxCols = Math.max(...rows.map(r => r.frameIndices.length));
  const showLabels = rows.length > 1 || hasAnimations;
  const labelW = showLabels ? LABEL_WIDTH : 0;

  const totalWidth = labelW + maxCols * (CELL_SIZE + GRID_GAP) + GRID_GAP;
  const totalHeight = rows.length * (CELL_SIZE + GRID_GAP) + GRID_GAP;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    rows.forEach((row, rowIdx) => {
      const y = GRID_GAP + rowIdx * (CELL_SIZE + GRID_GAP);

      // Draw row label
      if (showLabels) {
        ctx.fillStyle = '#22c55e';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(row.label, 8, y + CELL_SIZE / 2);
      }

      // Draw each frame in this row
      row.frameIndices.forEach((frameIdx, colIdx) => {
        const x = labelW + GRID_GAP + colIdx * (CELL_SIZE + GRID_GAP);
        drawCheckerboard(ctx, x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#2a2a42';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 0.5, y - 0.5, CELL_SIZE + 1, CELL_SIZE + 1);

        const frame = asset.frames[frameIdx];
        if (!frame) return;

        for (let fRow = 0; fRow < asset.size; fRow++) {
          for (let fCol = 0; fCol < asset.size; fCol++) {
            const val = frame[fRow][fCol];
            if (val === 0) continue;
            const color = palette[val];
            if (!color || color === 'transparent') continue;
            ctx.fillStyle = color;
            ctx.fillRect(
              x + fCol * PIXEL_SCALE,
              y + fRow * PIXEL_SCALE,
              PIXEL_SCALE,
              PIXEL_SCALE
            );
          }
        }
      });
    });

    onCanvasReady?.(canvas);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, palette, onCanvasReady]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={totalWidth}
      height={totalHeight}
      className="rounded border border-border"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
