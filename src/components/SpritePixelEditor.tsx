import { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteAsset } from '@/lib/types';

const PIXEL_SCALE = 20;
const CHECKER_SIZE = 10;
const GRID_COLOR = '#2a2a42';
const HOVER_COLOR = 'rgba(255,255,255,0.15)';

interface SpritePixelEditorProps {
  asset: SpriteAsset;
  frameIndex: number;
  activeColorKey: number;
  tool: 'pencil' | 'eraser';
  onPaintPixel: (row: number, col: number) => void;
  onErasePixel: (row: number, col: number) => void;
  onStrokeStart: () => void;
  brushSize: number;
}

export default function SpritePixelEditor({
  asset,
  frameIndex,
  activeColorKey,
  tool,
  onPaintPixel,
  onErasePixel,
  onStrokeStart,
  brushSize,
}: SpritePixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false); // right-click erase mode
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
  const hasStartedStroke = useRef(false);

  const canvasSize = asset.size * PIXEL_SCALE;
  const frame = asset.frames[frameIndex];

  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / (rect.width / asset.size));
    const row = Math.floor((e.clientY - rect.top) / (rect.height / asset.size));
    if (row < 0 || row >= asset.size || col < 0 || col >= asset.size) return null;
    return { r: row, c: col };
  }, [asset.size]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Checkerboard background
    for (let y = 0; y < canvasSize; y += CHECKER_SIZE) {
      for (let x = 0; x < canvasSize; x += CHECKER_SIZE) {
        const isEven = ((x / CHECKER_SIZE) + (y / CHECKER_SIZE)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1a1a2e' : '#22223a';
        ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
      }
    }

    // Draw pixels
    for (let row = 0; row < asset.size; row++) {
      for (let col = 0; col < asset.size; col++) {
        const val = frame[row][col];
        if (val === 0) continue;
        const color = asset.palette[val];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(col * PIXEL_SCALE, row * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
      }
    }

    // Grid lines
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= asset.size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SCALE, 0);
      ctx.lineTo(i * PIXEL_SCALE, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * PIXEL_SCALE);
      ctx.lineTo(canvasSize, i * PIXEL_SCALE);
      ctx.stroke();
    }

    // Hover highlight
    if (hoverCell) {
      ctx.fillStyle = HOVER_COLOR;
      const side = brushSize === 1 ? 1 : brushSize === 4 ? 2 : 4;
      for (let dr = 0; dr < side; dr++) {
        for (let dc = 0; dc < side; dc++) {
          const r = hoverCell.r + dr;
          const c = hoverCell.c + dc;
          if (r < asset.size && c < asset.size) {
            ctx.fillRect(
              c * PIXEL_SCALE,
              r * PIXEL_SCALE,
              PIXEL_SCALE,
              PIXEL_SCALE,
            );
          }
        }
      }
    }
  }, [asset, frame, frameIndex, canvasSize, hoverCell, brushSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCell(e);
    if (!cell) return;
    hasStartedStroke.current = true;
    onStrokeStart();

    if (e.button === 2) {
      // Right click = erase
      setIsErasing(true);
      onErasePixel(cell.r, cell.c);
    } else {
      setIsDrawing(true);
      onPaintPixel(cell.r, cell.c);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCell(e);
    setHoverCell(cell);
    if (cell) {
      if (isErasing) onErasePixel(cell.r, cell.c);
      else if (isDrawing) onPaintPixel(cell.r, cell.c);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsErasing(false);
    hasStartedStroke.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent browser context menu on canvas
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="rounded border border-border cursor-crosshair"
      style={{ imageRendering: 'pixelated', width: canvasSize, height: canvasSize }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onMouseLeave={() => { setIsDrawing(false); setIsErasing(false); setHoverCell(null); }}
    />
  );
}
