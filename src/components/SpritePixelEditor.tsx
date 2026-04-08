import { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { rotateFrameFree } from '@/lib/spriteTransforms';

const BASE_PIXEL_SCALE = 20;
const CHECKER_SIZE = 5;
const GRID_COLOR = '#2a2a42';

interface SpritePixelEditorProps {
  asset: SpriteAsset;
  frameIndex: number;
  activeColorKey: number;
  activeLayerId: string | null;
  tool: string;
  onPointerDown: (row: number, col: number, forceTool?: any) => void;
  onPointerMove: (row: number, col: number, forceTool?: any) => void;
  onPointerUp: () => void;
  brushSize: number;
  onionSkinPrevFrame?: number[][];
  onionSkinNextFrame?: number[][];
  draftFrame?: number[][] | null;
  moveOffset?: { dr: number; dc: number; activeLayerId?: string | null } | null;
  rotationAngle?: number | null;
  rotationCenter?: { r: number; c: number; activeLayerId?: string | null } | null;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
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
  moveOffset,
  rotationAngle,
  rotationCenter,
  zoom,
  setZoom,
}: SpritePixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);
  
  // Panning state
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const scrollStart = useRef<{ left: number; top: number } | null>(null);
  const isPanning = useRef(false);

  const PIXEL_SCALE = BASE_PIXEL_SCALE * zoom;
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
  }, [asset.size, PIXEL_SCALE]);

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
    const drawFrameData = (data: number[][], treatZeroAsTransparent: boolean, dr = 0, dc = 0) => {
      for (let row = 0; row < asset.size; row++) {
        for (let col = 0; col < asset.size; col++) {
          const val = data[row][col];
          if (val === -1) continue; // Always meaning "no pixel here"
          if (treatZeroAsTransparent && val === 0) continue; 
          
          if (val === 0) {
            ctx.fillStyle = '#ff000055';
          } else {
            const color = asset.palette[val];
            if (!color || color === 'transparent') continue;
            ctx.fillStyle = color;
          }
          
          const tr = row + dr;
          const tc = col + dc;
          if (tr >= 0 && tr < asset.size && tc >= 0 && tc < asset.size) {
            ctx.fillRect(tc * PIXEL_SCALE, tr * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
          }
        }
      }
    }

    const dr = moveOffset?.dr || 0;
    const dc = moveOffset?.dc || 0;
    const dra = rotationAngle || 0;
    const rCenter = rotationCenter;

    // Determine which layer(s) should be affected by the current preview
    // If null, all layers are affected. If string, only that one.
    // If undefined, no preview tool is active.
    const previewTargetId = moveOffset ? moveOffset.activeLayerId : (rotationCenter ? rotationCenter.activeLayerId : undefined);

    // Draw layers
    if (asset.layers && asset.layers.length > 0) {
      asset.layers.forEach(layer => {
        if (!layer.isVisible) return;
        const layerFrame = layer.frames[frameIndex];
        if (!layerFrame) return;

        const isActive = layer.id === activeLayerId;
        ctx.globalAlpha = isActive ? 1.0 : 0.4;

        const applyMove = (dr !== 0 || dc !== 0) && (
          previewTargetId === undefined || previewTargetId === null || previewTargetId === layer.id
        );
        const applyRot = (dra !== 0 && rCenter) && (
          previewTargetId === undefined || previewTargetId === null || previewTargetId === layer.id
        );

        const curDr = applyMove ? dr : 0;
        const curDc = applyMove ? dc : 0;

        let frameToDraw = isActive && draftFrame ? draftFrame : layerFrame;

        if (applyRot && rCenter) {
          // Compute the ACTUAL rotated pixels for a pixel-perfect preview
          // This ensures the user sees exactly what will be saved.
          frameToDraw = rotateFrameFree(frameToDraw, dra, rCenter);
        }

        drawFrameData(frameToDraw, true, curDr, curDc);
      });
      ctx.globalAlpha = 1.0;
    } else if (asset.frames?.[frameIndex]) {
      // Legacy fallback
      drawFrameData(asset.frames[frameIndex], true);
    }

    // Grid lines
    for (let i = 0; i <= asset.size; i++) {
        const isMajor = i % 8 === 0;
        ctx.strokeStyle = isMajor ? '#3f3f5a' : GRID_COLOR;
        ctx.lineWidth = isMajor ? 1 : 0.5;

        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SCALE, 0);
        ctx.lineTo(i * PIXEL_SCALE, canvasSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * PIXEL_SCALE);
        ctx.lineTo(canvasSize, i * PIXEL_SCALE);
        ctx.stroke();
    }
  }, [asset, activeLayerId, draftFrame, moveOffset, rotationAngle, rotationCenter, frameIndex, canvasSize, onionSkinPrevFrame, onionSkinNextFrame]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Attempt pointer capture to track outside canvas
    e.currentTarget.setPointerCapture(e.pointerId);

    const cell = getCell(e);
    
    if (e.button === 1) { // Middle Click (Wheel)
      // START PANNING
      panStart.current = { x: e.clientX, y: e.clientY };
      const parent = e.currentTarget.parentElement?.parentElement; // Scrollable container (div.overflow-auto)
      if (parent) {
        scrollStart.current = { left: parent.scrollLeft, top: parent.scrollTop };
      }
      isPanning.current = false; 
      return;
    }

    if (e.button === 2) { // Right Click
      // QUICK ERASE ONLY
      if (cell) {
        onPointerDown(cell.r, cell.c, 'eraser');
      }
      return;
    }

    if (e.button === 0) { // Left Click
      if (!cell) return;
      onPointerDown(cell.r, cell.c);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cell = getCell(e);
    setHoverCell(cell);

    if (e.buttons === 4 && panStart.current && scrollStart.current) { // 4 is middle button mask
      // Middle Click Pan
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      
      const parent = e.currentTarget.parentElement?.parentElement;
      if (parent) {
        parent.scrollLeft = scrollStart.current.left - dx;
        parent.scrollTop = scrollStart.current.top - dy;
      }
      return;
    }

    if (cell && (e.buttons === 1)) { // 1 is primary button mask
      onPointerMove(cell.r, cell.c);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    panStart.current = null;
    scrollStart.current = null;
    isPanning.current = false;
    onPointerUp();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.1, Math.min(8, prev + delta)));
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="rounded border border-border cursor-crosshair shrink-0 shadow-lg touch-none"
        style={{ imageRendering: 'pixelated' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onMouseLeave={() => { setHoverCell(null); }}
      />
    </div>
  );
}
