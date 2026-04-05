import { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteAsset } from '@/lib/types';

const PIXEL_SCALE = 20;
const CHECKER_SIZE = 5;
const GRID_COLOR = '#2a2a42';

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
  const [isErasing, setIsErasing] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
  const hasStartedStroke = useRef(false);

  const canvasSize = asset.size * PIXEL_SCALE;
  const frame = asset.frames[frameIndex] ?? null;

  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const col = Math.floor(x / PIXEL_SCALE);
    const row = Math.floor(y / PIXEL_SCALE);
    if (row < 0 || row >= asset.size || col < 0 || col >= asset.size) return null;
    return { r: row, c: col };
  }, [asset.size]);

  // Draw frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Skip redraw during active strokes (handled by drawOnCanvas)
    if (isDrawing || isErasing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Checkerboard background
    for (let y = 0; y < canvas.height; y += CHECKER_SIZE) {
      for (let x = 0; x < canvas.width; x += CHECKER_SIZE) {
        const isEven = ((x / CHECKER_SIZE) + (y / CHECKER_SIZE)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1a1a2e' : '#22223a';
        ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
      }
    }

    // Draw pixels
    if (frame) {
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
  }, [asset, frame, frameIndex, canvasSize, isDrawing, isErasing]);

  const drawOnCanvas = (cell: { r: number; c: number }, erase: boolean) => {
    if (erase) onErasePixel(cell.r, cell.c);
    else onPaintPixel(cell.r, cell.c);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCell(e);
    if (!cell) return;
    hasStartedStroke.current = true;
    onStrokeStart();

    const isErase = e.button === 2;
    if (isErase) setIsErasing(true);
    else setIsDrawing(true);

    drawOnCanvas(cell, isErase);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCell(e);
    setHoverCell(cell);
    if (cell) {
      if (isErasing) drawOnCanvas(cell, true);
      else if (isDrawing) drawOnCanvas(cell, false);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsErasing(false);
    hasStartedStroke.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="rounded border border-border cursor-crosshair max-w-full max-h-full shrink-0 shadow-lg"
        style={{ imageRendering: 'pixelated', objectFit: 'contain', aspectRatio: '1 / 1' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onMouseLeave={() => { setIsDrawing(false); setIsErasing(false); setHoverCell(null); }}
      />
    </div>
  );
}
