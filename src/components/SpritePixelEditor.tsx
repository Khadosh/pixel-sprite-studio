import { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteAsset } from '@/lib/types';

const PIXEL_SCALE = 20;
const CHECKER_SIZE = 5;
const GRID_COLOR = '#2a2a42';

interface SpritePixelEditorProps {
  asset: SpriteAsset;
  frameIndex: number;
  activeColorKey: number;
  activeLayerId: string | null;
  tool: string;
  onPointerDown: (row: number, col: number) => void;
  onPointerMove: (row: number, col: number) => void;
  onPointerUp: () => void;
  brushSize: number;
  onionSkinPrevFrame?: number[][];
  onionSkinNextFrame?: number[][];
  draftFrame?: number[][] | null;
}

export default function SpritePixelEditor({
  asset,
  frameIndex,
  activeLayerId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onionSkinPrevFrame,
  onionSkinNextFrame,
  draftFrame,
}: SpritePixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  const canvasSize = asset.size * PIXEL_SCALE;
  
  // No longer using a single 'frame' variable at the top level
  // as we index into layers inside the draw loop.

  const getCell = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Checkerboard background
    for (let y = 0; y < canvas.height; y += CHECKER_SIZE) {
      for (let x = 0; x < canvas.width; x += CHECKER_SIZE) {
        const isEven = ((x / CHECKER_SIZE) + (y / CHECKER_SIZE)) % 2 === 0;
        ctx.fillStyle = isEven ? '#1a1a2e' : '#22223a';
        ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
      }
    }

    // Draw ghost frames (Onion skin)
    const drawGhost = (ghostFrame: number[][], alpha: number, colorOverride?: string) => {
      ctx.globalAlpha = alpha;
      for (let row = 0; row < asset.size; row++) {
        for (let col = 0; col < asset.size; col++) {
          const val = ghostFrame[row][col];
          if (val === 0) continue;
          
          if (colorOverride) {
             ctx.fillStyle = colorOverride;
          } else {
             const color = asset.palette[val];
             if (!color || color === 'transparent') continue;
             ctx.fillStyle = color;
          }
          ctx.fillRect(col * PIXEL_SCALE, row * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        }
      }
      ctx.globalAlpha = 1.0;
    };

    if (onionSkinPrevFrame) drawGhost(onionSkinPrevFrame, 0.35, '#ff4a4a');
    if (onionSkinNextFrame) drawGhost(onionSkinNextFrame, 0.35, '#4aff4a');

    // Helper to draw a specific frame matrix
    const drawFrameData = (data: number[][], treatZeroAsTransparent: boolean) => {
      for (let row = 0; row < asset.size; row++) {
        for (let col = 0; col < asset.size; col++) {
          const val = data[row][col];
          if (val === -1) continue; // Always meaning "no pixel here"
          if (treatZeroAsTransparent && val === 0) continue; 
          
          if (val === 0) {
            // Eraser tool effectively drawing 0 (transparent) on draft: 
            // We draw a visual cue like a dark checkered red or just clear it. 
            // We can draw a grey square to denote it's being erased
            ctx.fillStyle = '#ff000055';
          } else {
            const color = asset.palette[val];
            if (!color || color === 'transparent') continue;
            ctx.fillStyle = color;
          }
          ctx.fillRect(col * PIXEL_SCALE, row * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
        }
      }
    }

    // Draw layers
    if (asset.layers && asset.layers.length > 0) {
      asset.layers.forEach(layer => {
        if (!layer.isVisible) return;
        const layerFrame = layer.frames[frameIndex];
        if (!layerFrame) return;

        // Dim non-active layers
        const isActive = layer.id === activeLayerId;
        ctx.globalAlpha = isActive ? 1.0 : 0.4;
        
        drawFrameData(layerFrame, true);
      });
      ctx.globalAlpha = 1.0;
    } else if (asset.frames?.[frameIndex]) {
      // Legacy fallback
      drawFrameData(asset.frames[frameIndex], true);
    }
    
    // Draw draft frame overlay (most likely for the active layer)
    if (draftFrame) {
      drawFrameData(draftFrame, false);
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
  }, [asset, activeLayerId, draftFrame, frameIndex, canvasSize, onionSkinPrevFrame, onionSkinNextFrame]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only accept left click
    if (e.button !== 0) return;
    
    // Attempt pointer capture to track outside canvas
    e.currentTarget.setPointerCapture(e.pointerId);

    const cell = getCell(e);
    if (!cell) return;

    onPointerDown(cell.r, cell.c);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = getCell(e);
    setHoverCell(cell);
    if (cell && e.buttons === 1) { // 1 means primary button is pressed
      onPointerMove(cell.r, cell.c);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    onPointerUp();
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
        className="rounded border border-border cursor-crosshair max-w-full max-h-full shrink-0 shadow-lg touch-none"
        style={{ imageRendering: 'pixelated', objectFit: 'contain', aspectRatio: '1 / 1' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        onMouseLeave={() => { setHoverCell(null); }}
      />
    </div>
  );
}
