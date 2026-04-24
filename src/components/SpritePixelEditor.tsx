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
  onAnatomyChange?: (updates: Partial<import('@/lib/types').AnatomyConfig>) => void;
  onPushUndo?: () => void;
  showIsometricGrid?: boolean;
  referenceFrame?: number[][] | null;
  
  // Anatomy selection
  anatomyActiveMemberId?: string | null;
  anatomyIsSelectionMode?: boolean;
  onToggleMemberPixel?: (r: number, c: number, force?: boolean) => void;
  anatomySelectedOrientation?: number;
}

export default function SpritePixelEditor({
  asset,
  frameIndex,
  activeLayerId,
  tool,
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
  showIsometricGrid = false,
  referenceFrame,
  anatomyActiveMemberId,
  anatomyIsSelectionMode,
  onToggleMemberPixel,
  anatomySelectedOrientation,
}: SpritePixelEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<{ r: number; c: number } | null>(null);

  // Anatomy interaction state
  const [hoveringBone, setHoveringBone] = useState<'neck' | 'waist' | 'ankles' | 'torsoL' | 'torsoR' | 'torsoC' | 'knees' | null>(null);
  const [draggingBone, setDraggingBone] = useState<'neck' | 'waist' | 'ankles' | 'torsoL' | 'torsoR' | 'torsoC' | 'knees' | null>(null);
  
  // Track if we are adding or removing during anatomy drag
  const anatomyPaintMode = useRef<boolean | null>(null);
  const lastPaintedCell = useRef<{ r: number, c: number } | null>(null);

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

    const col = x / PIXEL_SCALE;
    const row = y / PIXEL_SCALE;
    
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
    
    // Draw Perspective Reference (Sketch Mode) - Always showing Front base
    if (referenceFrame) {
      drawGhost(referenceFrame, 0.25, '#38bdf8'); // Monochromatic Sketch Blue (Blueprint style)
    }

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

    // Isometric Grid (2:1)
    if (showIsometricGrid) {
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)'; // Indigo-ish
      ctx.lineWidth = 1;
      
      const step = 8; // Major diamonds every 8 pixels
      const diamondWidth = step * PIXEL_SCALE;
      const diamondHeight = (step / 2) * PIXEL_SCALE;
      
      // Draw lines \
      for (let i = -asset.size; i <= asset.size * 2; i += step) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SCALE, 0);
        ctx.lineTo((i + asset.size * 2) * PIXEL_SCALE, asset.size * PIXEL_SCALE);
        ctx.stroke();
      }
      
      // Draw lines /
      for (let i = -asset.size; i <= asset.size * 2; i += step) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SCALE, 0);
        ctx.lineTo((i - asset.size * 2) * PIXEL_SCALE, asset.size * PIXEL_SCALE);
        ctx.stroke();
      }
    }
    
    // ─── ANATOMICAL BONES VISUALIZATION ───
    if (asset.category === 'character' && leftSidebarTab === 'anatomy') {
      // Compute a temporary composite of all visible layers for accurate anatomy detection
      const compositeFrame = Array.from({ length: asset.size }, () => Array(asset.size).fill(0));
      if (asset.layers) {
        asset.layers.forEach(layer => {
          if (!layer.isVisible) return;
          const frame = layer.frames[frameIndex];
          if (!frame) return;
          for (let r = 0; r < asset.size; r++) {
            for (let c = 0; c < asset.size; c++) {
              if (frame[r][c] !== 0) compositeFrame[r][c] = frame[r][c];
            }
          }
        });
      }

      if (compositeFrame) {
        const segments: import('@/lib/sprite/anatomy').BodySegments = analyzeBodySegments(compositeFrame, asset.anatomy);
        const { neckRow, waistRow, torsoLeft, torsoRight, torsoCenterCol, ankleRow, kneeRow } = segments;
        
        const drawBone = (type: string, color: string, pos: number, isVertical: boolean, dashed: boolean = false) => {
          const isSelected = hoveringBone === type || draggingBone === type;
          ctx.strokeStyle = color;
          ctx.globalAlpha = isSelected ? 1.0 : 0.6;
          ctx.lineWidth = isSelected ? 2 : 1;
          
          if (dashed) ctx.setLineDash([4, 4]);
          else ctx.setLineDash([]);

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
          ctx.setLineDash([]);
        };

        // Regions Visualization (Subtle Rects)
        const drawRegion = (r1: number, r2: number, c1: number, c2: number, color: string, label: string) => {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.05;
          ctx.fillRect(c1 * PIXEL_SCALE, r1 * PIXEL_SCALE, (c2 - c1 + 1) * PIXEL_SCALE, (r2 - r1 + 1) * PIXEL_SCALE);
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = color;
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(c1 * PIXEL_SCALE, r1 * PIXEL_SCALE, (c2 - c1 + 1) * PIXEL_SCALE, (r2 - r1 + 1) * PIXEL_SCALE);
          ctx.setLineDash([]);
          
          // Label
          ctx.fillStyle = color;
          ctx.font = '8px Inter, sans-serif';
          ctx.fillText(label, c1 * PIXEL_SCALE + 2, r1 * PIXEL_SCALE + 8);
        };

        // Draw Areas
        drawRegion(0, neckRow - 1, torsoLeft, torsoRight, '#38bdf8', 'HEAD');
        drawRegion(neckRow, waistRow - 1, torsoLeft, torsoRight, '#fb923c', 'TORSO');

        // Neck line (Sky Blue)
        drawBone('neck', 'rgba(135, 206, 235)', neckRow, false);
        // Waist line (Coral)
        drawBone('waist', 'rgba(255, 127, 80)', waistRow, false);
        // Knee line (Pink)
        drawBone('knees', 'rgba(244, 114, 182)', kneeRow, false);
        // Ankle line (Lime/Yellow-ish)
        drawBone('ankles', 'rgba(163, 230, 53)', ankleRow, false);
        // Torso Left line (Amethyst/Purple)
        drawBone('torsoL', 'rgba(168, 85, 247)', torsoLeft, true);
        // Torso Right line (Orange)
        drawBone('torsoR', 'rgba(249, 115, 22)', torsoRight, true);
        // Torso Center line (Yellow)
        drawBone('torsoC', 'rgba(253, 224, 71)', torsoCenterCol, true, true);

        // ─── DISMEMBERMENT (Custom Pixels) ───
        const currentOrientation = asset.anatomy?.orientations?.[anatomySelectedOrientation ?? 0];
        if (currentOrientation?.members) {
          currentOrientation.members.forEach(member => {
            const isActive = member.id === anatomyActiveMemberId;
            const isEditing = isActive && anatomyIsSelectionMode;
            
            if (member.pixels && member.pixels.length > 0) {
              const color = member.type.includes('arm') ? '#38bdf8' :
                          member.type.includes('leg') ? '#fb7185' :
                          member.type === 'head' ? '#fbbf24' : '#fb923c';
              
              ctx.fillStyle = color;
              ctx.globalAlpha = isActive ? 0.6 : 0.2;
              
              member.pixels.forEach(p => {
                ctx.fillRect(p.c * PIXEL_SCALE, p.r * PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
                
                if (isEditing) {
                  ctx.strokeStyle = '#ffffff';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(p.c * PIXEL_SCALE + 1, p.r * PIXEL_SCALE + 1, PIXEL_SCALE - 2, PIXEL_SCALE - 2);
                }
              });
              ctx.globalAlpha = 1.0;
            }
          });
        }
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
    if (!cell) return;

    // Anatomy Interaction First
    if (leftSidebarTab === 'anatomy') {
      if (anatomyIsSelectionMode && anatomyActiveMemberId && onToggleMemberPixel) {
        const ir = Math.floor(cell.r);
        const ic = Math.floor(cell.c);
        
        // Determine if we are adding or removing based on current state of clicked pixel
        const currentOrientation = asset.anatomy?.orientations?.[anatomySelectedOrientation ?? 0];
        const member = currentOrientation?.members.find(m => m.id === anatomyActiveMemberId);
        const isSelected = member?.pixels?.some(p => p.r === ir && p.c === ic);
        
        anatomyPaintMode.current = !isSelected;
        lastPaintedCell.current = { r: ir, c: ic };
        onToggleMemberPixel(ir, ic, !isSelected);
        return;
      }
      
      // Only allow bone dragging if NOT in selection mode
      if (hoveringBone && !anatomyIsSelectionMode) {
        if (onPushUndo) onPushUndo();
        setDraggingBone(hoveringBone);
        return;
      }
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
    
    // 0. Handle Anatomy Selection Painting
    if (leftSidebarTab === 'anatomy' && anatomyIsSelectionMode && anatomyActiveMemberId && e.buttons === 1 && anatomyPaintMode.current !== null) {
       const ir = Math.floor(r);
       const ic = Math.floor(c);
       
       if (!lastPaintedCell.current || lastPaintedCell.current.r !== ir || lastPaintedCell.current.c !== ic) {
          lastPaintedCell.current = { r: ir, c: ic };
          onToggleMemberPixel?.(ir, ic, anatomyPaintMode.current);
       }
       return;
    }

    // 1. Handle Bone Dragging
    if (draggingBone && onAnatomyChange) {
      const ir = Math.round(r);
      const ic = Math.round(c);
      if (draggingBone === 'neck') onAnatomyChange({ neckRow: ir });
      else if (draggingBone === 'waist') onAnatomyChange({ waistRow: ir });
      else if (draggingBone === 'knees') onAnatomyChange({ kneeRow: ir });
      else if (draggingBone === 'ankles') onAnatomyChange({ ankleRow: ir });
      else if (draggingBone === 'torsoL') onAnatomyChange({ torsoLeft: ic });
      else if (draggingBone === 'torsoR') onAnatomyChange({ torsoRight: ic });
      else if (draggingBone === 'torsoC') onAnatomyChange({ torsoCenterCol: ic });
      return;
    }

    // 2. Handle Panning
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

    // 3. Handle Drawing
    if (e.buttons === 1 && !draggingBone) {
      onPointerMove(r, c);
      return;
    }

    // 4. Handle Bone Hover Detection (only in anatomy tab and NOT in selection mode)
    if (leftSidebarTab === 'anatomy' && !anatomyIsSelectionMode && !isPanning.current && e.buttons === 0) {
      const tolerance = 6;
      const compositeFrame = Array.from({ length: asset.size }, () => Array(asset.size).fill(0));
      if (asset.layers) {
        asset.layers.forEach(layer => {
          if (!layer.isVisible) return;
          const f = layer.frames[frameIndex];
          if (f) {
            for (let fr = 0; fr < asset.size; fr++) {
              for (let fc = 0; fc < asset.size; fc++) {
                if (f[fr][fc] !== 0) compositeFrame[fr][fc] = f[fr][fc];
              }
            }
          }
        });
      }

      const segments: import('@/lib/sprite/anatomy').BodySegments = analyzeBodySegments(compositeFrame, asset.anatomy);
      const { neckRow, waistRow, torsoLeft, torsoRight, torsoCenterCol, ankleRow, kneeRow } = segments;
      
      const neckY = neckRow * PIXEL_SCALE + PIXEL_SCALE / 2;
      const waistY = waistRow * PIXEL_SCALE + PIXEL_SCALE / 2;
      const kneeY = kneeRow * PIXEL_SCALE + PIXEL_SCALE / 2;
      const ankleY = ankleRow * PIXEL_SCALE + PIXEL_SCALE / 2;
      const torsoLX = torsoLeft * PIXEL_SCALE + PIXEL_SCALE / 2;
      const torsoRX = torsoRight * PIXEL_SCALE + PIXEL_SCALE / 2;
      const torsoCX = torsoCenterCol * PIXEL_SCALE + PIXEL_SCALE / 2;

      if (Math.abs(y - neckY) < tolerance) setHoveringBone('neck');
      else if (Math.abs(y - waistY) < tolerance) setHoveringBone('waist');
      else if (Math.abs(y - kneeY) < tolerance) setHoveringBone('knees');
      else if (Math.abs(y - ankleY) < tolerance) setHoveringBone('ankles');
      else if (Math.abs(x - torsoLX) < tolerance) setHoveringBone('torsoL');
      else if (Math.abs(x - torsoRX) < tolerance) setHoveringBone('torsoR');
      else if (Math.abs(x - torsoCX) < tolerance) setHoveringBone('torsoC');
      else setHoveringBone(null);
    } else if (leftSidebarTab !== 'anatomy') {
       setHoveringBone(null);
    }

    // 5. Cursor Feedback
    if (canvasRef.current) {
      if (draggingBone || hoveringBone) {
        const type = draggingBone || hoveringBone;
        canvasRef.current.style.cursor = (type === 'neck' || type === 'waist' || type === 'ankles') ? 'ns-resize' : 'ew-resize';
      } else if (tool === 'select') {
        // Handle hit testing for cursors
        const threshold = 0.5;
        if (selectionRect) {
          const handles = [
            { r: selectionRect.r, c: selectionRect.c, cursor: 'nwse-resize' }, // 0: TL
            { r: selectionRect.r, c: selectionRect.c + selectionRect.w, cursor: 'nesw-resize' }, // 1: TR
            { r: selectionRect.r + selectionRect.h, c: selectionRect.c, cursor: 'nesw-resize' }, // 2: BL
            { r: selectionRect.r + selectionRect.h, c: selectionRect.c + selectionRect.w, cursor: 'nwse-resize' }, // 3: BR
            { r: selectionRect.r, c: selectionRect.c + selectionRect.w / 2, cursor: 'ns-resize' }, // 4: TM
            { r: selectionRect.r + selectionRect.h, c: selectionRect.c + selectionRect.w / 2, cursor: 'ns-resize' }, // 5: BM
            { r: selectionRect.r + selectionRect.h / 2, c: selectionRect.c, cursor: 'ew-resize' }, // 6: LM
            { r: selectionRect.r + selectionRect.h / 2, c: selectionRect.c + selectionRect.w, cursor: 'ew-resize' }, // 7: RM
          ];
          
          let foundHandle = false;
          const hitThreshold = 0.8;
          for (const h of handles) {
            if (Math.abs(r - h.r) <= hitThreshold && Math.abs(c - h.c) <= hitThreshold) {
              canvasRef.current.style.cursor = h.cursor;
              foundHandle = true;
              break;
            }
          }

          if (!foundHandle) {
            // Check if inside
            if (r >= selectionRect.r && r < selectionRect.r + selectionRect.h && c >= selectionRect.c && c < selectionRect.c + selectionRect.w) {
              canvasRef.current.style.cursor = 'move';
            } else {
              canvasRef.current.style.cursor = 'crosshair';
            }
          }
        } else {
          canvasRef.current.style.cursor = 'crosshair';
        }
      } else if (tool === 'rotate') {
        canvasRef.current.style.cursor = 'grab';
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
    anatomyPaintMode.current = null;
    lastPaintedCell.current = null;
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
