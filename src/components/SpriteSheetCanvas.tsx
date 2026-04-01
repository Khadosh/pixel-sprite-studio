import { useRef, useEffect, useCallback } from 'react';
import { ANIMATIONS, FRAME_SIZE, PALETTE } from '@/lib/pixelCharacter';

const PIXEL_SCALE = 4;
const CELL_SIZE = FRAME_SIZE * PIXEL_SCALE; // 64px per frame
const GRID_GAP = 2;
const LABEL_WIDTH = 80;
const CHECKER_SIZE = 8;

interface SpriteSheetCanvasProps {
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
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

function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: number[][],
  offsetX: number,
  offsetY: number
) {
  for (let row = 0; row < FRAME_SIZE; row++) {
    for (let col = 0; col < FRAME_SIZE; col++) {
      const val = frame[row][col];
      if (val === 0) continue;
      const color = PALETTE[val];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        offsetX + col * PIXEL_SCALE,
        offsetY + row * PIXEL_SCALE,
        PIXEL_SCALE,
        PIXEL_SCALE
      );
    }
  }
}

export default function SpriteSheetCanvas({ onCanvasReady }: SpriteSheetCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const maxFrames = Math.max(...ANIMATIONS.map(a => a.frames.length));
  const totalWidth = LABEL_WIDTH + maxFrames * (CELL_SIZE + GRID_GAP) + GRID_GAP;
  const totalHeight = ANIMATIONS.length * (CELL_SIZE + GRID_GAP) + GRID_GAP;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#12121f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ANIMATIONS.forEach((anim, rowIdx) => {
      const y = GRID_GAP + rowIdx * (CELL_SIZE + GRID_GAP);

      // Label
      ctx.fillStyle = '#22c55e';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(anim.label, 8, y + CELL_SIZE / 2);

      // Frames
      anim.frames.forEach((frame, colIdx) => {
        const x = LABEL_WIDTH + GRID_GAP + colIdx * (CELL_SIZE + GRID_GAP);

        // Checkerboard bg
        drawCheckerboard(ctx, x, y, CELL_SIZE, CELL_SIZE);

        // Border
        ctx.strokeStyle = '#2a2a42';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 0.5, y - 0.5, CELL_SIZE + 1, CELL_SIZE + 1);

        // Draw pixels
        drawFrame(ctx, frame, x, y);
      });
    });

    onCanvasReady?.(canvas);
  }, [onCanvasReady]);

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
