import { useRef, useEffect, useCallback, useState } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { rotateFrameFree, analyzeBodySegments } from '@/lib/spriteTransforms';

const BASE_PIXEL_SCALE = 16;
const GRID_COLOR = 'rgba(255, 255, 255, 0.03)';

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

  rotationAngle?: number | null;
  rotationCenter?: { r: number; c: number; activeLayerId?: string | null } | null;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  selectionRect?: { r: number; c: number; w: number; h: number } | null;
  movingSelectionPixels?: number[][] | null;
  canvasBg: 'light' | 'dark';
  leftSidebarTab?: string | null;
  onAnatomyChange?: (updates: Partial<{ neckRow: number; waistRow: number; ankleRow: number; torsoLeft: number; torsoRight: number }>) => void;
  onPushUndo?: () => void;
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

  rotationAngle,
  rotationCenter,
  zoom,
  setZoom,
  selectionRect,
  movingSelectionPixels,
  canvasBg,
  leftSidebarTab,
  onAnatomyChange,
  onPushUndo,
}: SpritePixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  // Anatomy interaction state
  const [hoveringBone, setHoveringBone] = useState<'neck' | 'waist' | 'ankles' | 'torsoL' | 'torsoR' | null>(null);
  const [draggingBone, setDraggingBone] = useState<'neck' | 'waist' | 'ankles' | 'torsoL' | 'torsoR' | null>(null);

  // Panning state
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const scrollStart = useRef<{ left: number; top: number } | null>(null);
  const isPanning = useRef(false);

  const PIXEL_SCALE = BASE_PIXEL_SCALE * zoom;
  const canvasSize = asset.size * PIXEL_SCALE;

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
    
    // Return both cell and sub-pixel coordinates for bone hit testing
    return { r: row, c: col, x, y };
  }, [PIXEL_SCALE]);

  // Draw frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Checkerboard background (aligned with logical pixels)
    const colorA = canvasBg === 'light' ? '#e5e5e5' : '#121212';
    const colorB = canvasBg === 'light' ? '#f5f5f5' : '#1e1e1e';
    
    for (let row = 0; row < asset.size; row++) {
      for (let col = 0; col < asset.size; col++) {
        const isEven = (row + col) % 2 === 0;
        ctx.fillStyle = isEven ? colorA : colorB;
        ctx.fillRect(col * PIXEL_SCALE, row * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
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
      const rows = data.length;
      if (rows === 0) return;
      const cols = data[0].length;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
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

    const dra = rotationAngle || 0;
    const rCenter = rotationCenter;

    // Determine which layer(s) should be affected by the current preview
    // If null, all layers are affected. If string, only that one.
    // If undefined, no preview tool is active.
    const previewTargetId = rotationCenter ? rotationCenter.activeLayerId : undefined;

    // Draw layers
    if (asset.layers && asset.layers.length > 0) {
      asset.layers.forEach(layer => {
        if (!layer.isVisible) return;
        const layerFrame = layer.frames[frameIndex];
        if (!layerFrame) return;

        const isScopeFrame = previewTargetId === null;
        const isActive = layer.id === activeLayerId;

        // Force full opacity for all layers if we are rotating the whole frame
        ctx.globalAlpha = (isScopeFrame && (dra !== 0)) ? 1.0 : (isActive ? 1.0 : 0.4);

        const applyRot = (dra !== 0 && rCenter) && !movingSelectionPixels && (
          isScopeFrame || previewTargetId === layer.id
        );

        let frameToDraw = layerFrame;

        if (applyRot && rCenter) {
          frameToDraw = rotateFrameFree(frameToDraw, dra, rCenter);
        }

        drawFrameData(frameToDraw, true, 0, 0);

        // Draw draft (preview of shapes) on top of the layer
        if (isActive && draftFrame) {
          drawFrameData(draftFrame, true, 0, 0);
        }
      });
      ctx.globalAlpha = 1.0;
    } else if (asset.frames?.[frameIndex]) {
      // Legacy fallback
      drawFrameData(asset.frames[frameIndex], true, 0, 0);
    }

    // Grid lines
    for (let i = 0; i <= asset.size; i++) {
      const isMajor = i % 8 === 0;
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.08)' : GRID_COLOR;
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
    
    // ─── ANATOMICAL BONES VISUALIZATION ───
    if (asset.category === 'character' && leftSidebarTab === 'anatomy') {
      const compositeFrame = asset.layers?.[0]?.frames[frameIndex];
      if (compositeFrame) {
        const { neckRow, waistRow, torsoLeft, torsoRight, ankleRow } = analyzeBodySegments(compositeFrame, asset.anatomy);
        
        const drawBone = (type: 'neck' | 'waist' | 'ankles' | 'torsoL' | 'torsoR', color: string, pos: number, isVertical: boolean) => {
          const isSelected = hoveringBone === type || draggingBone === type;
          ctx.strokeStyle = color;
          ctx.globalAlpha = isSelected ? 1.0 : 0.6;
          ctx.lineWidth = isSelected ? 2 : 1;
          
          if (isSelected) {
             ctx.shadowBlur = 4;
             ctx.shadowColor = color;
          }

          ctx.beginPath();
          const screenPos = pos * PIXEL_SCALE + PIXEL_SCALE / 2;
          if (isVertical) {
            ctx.moveTo(screenPos, 0);
            ctx.lineTo(screenPos, canvasSize);
          } else {
            ctx.moveTo(0, screenPos);
            ctx.lineTo(canvasSize, screenPos);
          }
          ctx.stroke();
          
          // Reset effects
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
        };

        // Neck line (Sky Blue)
        drawBone('neck', 'rgba(135, 206, 235)', neckRow, false);
        // Waist line (Coral)
        drawBone('waist', 'rgba(255, 127, 80)', waistRow, false);
        // Ankle line (Lime/Yellow-ish)
        drawBone('ankles', 'rgba(163, 230, 53)', ankleRow, false);
        // Torso Left line (Amethyst/Purple)
        drawBone('torsoL', 'rgba(168, 85, 247)', torsoLeft, true);
        // Torso Right line (Orange)
        drawBone('torsoR', 'rgba(249, 115, 22)', torsoRight, true);
      }
    }

    // Draw selection rectangle
    if (selectionRect) {
      // Fill shading
      ctx.fillStyle = 'rgba(79, 70, 229, 0.15)';
      ctx.fillRect(
        selectionRect.c * PIXEL_SCALE,
        selectionRect.r * PIXEL_SCALE,
        selectionRect.w * PIXEL_SCALE,
        selectionRect.h * PIXEL_SCALE
      );

      // Border
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        selectionRect.c * PIXEL_SCALE,
        selectionRect.r * PIXEL_SCALE,
        selectionRect.w * PIXEL_SCALE,
        selectionRect.h * PIXEL_SCALE
      );

      ctx.strokeStyle = '#4f46e5';
      ctx.lineDashOffset = 5;
      ctx.strokeRect(
        selectionRect.c * PIXEL_SCALE,
        selectionRect.r * PIXEL_SCALE,
        selectionRect.w * PIXEL_SCALE,
        selectionRect.h * PIXEL_SCALE
      );
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;

      // Handles (Circles)
      const handleSize = 4;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1;

      const handles = [
        { r: selectionRect.r, c: selectionRect.c },
        { r: selectionRect.r, c: selectionRect.c + selectionRect.w },
        { r: selectionRect.r + selectionRect.h, c: selectionRect.c },
        { r: selectionRect.r + selectionRect.h, c: selectionRect.c + selectionRect.w },
        { r: selectionRect.r, c: selectionRect.c + selectionRect.w / 2 },
        { r: selectionRect.r + selectionRect.h, c: selectionRect.c + selectionRect.w / 2 },
        { r: selectionRect.r + selectionRect.h / 2, c: selectionRect.c },
        { r: selectionRect.r + selectionRect.h / 2, c: selectionRect.c + selectionRect.w },
      ];

      handles.forEach(h => {
        ctx.beginPath();
        ctx.arc(h.c * PIXEL_SCALE, h.r * PIXEL_SCALE, handleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Draw floating pixels if moving
      if (movingSelectionPixels) {
        let pixelsToDraw = movingSelectionPixels;
        if (rotationAngle && rotationCenter) {
          pixelsToDraw = rotateFrameFree(pixelsToDraw, rotationAngle, rotationCenter);
        }
        drawFrameData(pixelsToDraw, true, 0, 0);
      }
    }
  }, [asset, activeLayerId, draftFrame, rotationAngle, rotationCenter, frameIndex, canvasSize, onionSkinPrevFrame, onionSkinNextFrame, selectionRect, movingSelectionPixels, PIXEL_SCALE, canvasBg, leftSidebarTab, hoveringBone, draggingBone]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Attempt pointer capture to track outside canvas
    e.currentTarget.setPointerCapture(e.pointerId);

    const cell = getCell(e);

    // Anatomy Interaction First
    if (leftSidebarTab === 'anatomy' && hoveringBone) {
      if (onPushUndo) onPushUndo();
      setDraggingBone(hoveringBone);
      return;
    }

    if (e.button === 1) { // Middle Click (Wheel)
      panStart.current = { x: e.clientX, y: e.clientY };
      const parent = e.currentTarget.parentElement?.parentElement;
      if (parent) {
        scrollStart.current = { left: parent.scrollLeft, top: parent.scrollTop };
      }
      isPanning.current = false;
      return;
    }

    if (e.button === 2) { // Right Click
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
    const data = getCell(e);
    if (!data) {
      setHoverCell(null);
      setHoveringBone(null);
      return;
    }
    const { r, c, x, y } = data;
    setHoverCell({ r, c });

    // 1. Handle Bone Dragging
    if (draggingBone && onAnatomyChange) {
      if (draggingBone === 'neck') onAnatomyChange({ neckRow: r });
      else if (draggingBone === 'waist') onAnatomyChange({ waistRow: r });
      else if (draggingBone === 'ankles') onAnatomyChange({ ankleRow: r });
      else if (draggingBone === 'torsoL') onAnatomyChange({ torsoLeft: c });
      else if (draggingBone === 'torsoR') onAnatomyChange({ torsoRight: c });
      return;
    }

    // 2. Handle Bone Hover Detection (only in anatomy tab)
    if (leftSidebarTab === 'anatomy' && !isPanning.current && e.buttons === 0) {
      const tolerance = 6;
      const compositeFrame = asset.layers?.[0]?.frames[frameIndex];
      if (compositeFrame) {
        const { neckRow, waistRow, torsoLeft, torsoRight, ankleRow } = analyzeBodySegments(compositeFrame, asset.anatomy);
        
        const neckY = neckRow * PIXEL_SCALE + PIXEL_SCALE / 2;
        const waistY = waistRow * PIXEL_SCALE + PIXEL_SCALE / 2;
        const ankleY = ankleRow * PIXEL_SCALE + PIXEL_SCALE / 2;
        const torsoLX = torsoLeft * PIXEL_SCALE + PIXEL_SCALE / 2;
        const torsoRX = torsoRight * PIXEL_SCALE + PIXEL_SCALE / 2;

        if (Math.abs(y - neckY) < tolerance) setHoveringBone('neck');
        else if (Math.abs(y - waistY) < tolerance) setHoveringBone('waist');
        else if (Math.abs(y - ankleY) < tolerance) setHoveringBone('ankles');
        else if (Math.abs(x - torsoLX) < tolerance) setHoveringBone('torsoL');
        else if (Math.abs(x - torsoRX) < tolerance) setHoveringBone('torsoR');
        else setHoveringBone(null);
      }
    } else if (leftSidebarTab !== 'anatomy') {
       setHoveringBone(null);
    }

    // 3. Handle Panning
    if (e.buttons === 4 && panStart.current && scrollStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const parent = e.currentTarget.parentElement?.parentElement;
      if (parent) {
        parent.scrollLeft = scrollStart.current.left - dx;
        parent.scrollTop = scrollStart.current.top - dy;
      }
      return;
    }

    // 4. Handle Drawing
    if (e.buttons === 1 && !draggingBone) {
      onPointerMove(r, c);
    }

    // 5. Cursor Feedback
    if (canvasRef.current) {
      if (draggingBone || hoveringBone) {
        const type = draggingBone || hoveringBone;
        canvasRef.current.style.cursor = (type === 'neck' || type === 'waist' || type === 'ankles') ? 'ns-resize' : 'ew-resize';
      } else {
        canvasRef.current.style.cursor = 'crosshair';
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    panStart.current = null;
    scrollStart.current = null;
    isPanning.current = false;
    setDraggingBone(null);
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
