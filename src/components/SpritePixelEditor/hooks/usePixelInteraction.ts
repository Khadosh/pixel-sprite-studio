import { useRef } from 'react';
import type { SpriteAsset } from '@/lib/types';
import { getPixelCoords } from '../utils/canvasCoords';
import { analyzeBodySegments } from '@/lib/spriteTransforms';

interface InteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  asset: SpriteAsset;
  frameIndex: number;
  zoom: number;
  tool: string;
  onPointerDown: (row: number, col: number, forceTool?: any) => void;
  onPointerMove: (row: number, col: number, forceTool?: any) => void;
  onPointerUp: () => void;
  leftSidebarTab?: string | null;
  onAnatomyChange?: (updates: any) => void;
  anatomyActiveMemberId?: string | null;
  anatomyIsSelectionMode?: boolean;
  onToggleMemberPixel?: (r: number, c: number, force?: boolean) => void;
  setHoveringBone: (bone: any) => void;
  setDraggingBone: (bone: any) => void;
  setHoverCell: (cell: any) => void;
  draggingBone: string | null;
}

export function usePixelInteraction({
  canvasRef,
  asset,
  frameIndex,
  zoom,
  tool,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  leftSidebarTab,
  onAnatomyChange,
  anatomyActiveMemberId,
  anatomyIsSelectionMode,
  onToggleMemberPixel,
  setHoveringBone,
  setDraggingBone,
  setHoverCell,
  draggingBone,
}: InteractionProps) {
  const PIXEL_SCALE = 16 * zoom;
  
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const scrollStart = useRef<{ left: number; top: number } | null>(null);
  const isPanning = useRef(false);
  const anatomyPaintMode = useRef<boolean | null>(null);
  const lastPaintedCell = useRef<{ r: number, c: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e.clientX, e.clientY, e.currentTarget, PIXEL_SCALE);
    if (!coords) return;
    const { row, col } = coords;

    if (e.button === 1 || tool === 'pan') {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      const scrollContainer = e.currentTarget.parentElement?.parentElement;
      if (scrollContainer) {
        scrollStart.current = { left: scrollContainer.scrollLeft, top: scrollContainer.scrollTop };
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    if (leftSidebarTab === 'anatomy') {
      if (anatomyIsSelectionMode && anatomyActiveMemberId && onToggleMemberPixel) {
        const orientationIdx = 0; // Default to Front for now
        const currentOrientation = asset.anatomy?.orientations?.[orientationIdx];
        const member = currentOrientation?.members.find(m => m.id === anatomyActiveMemberId);
        const alreadyHas = member?.pixels?.some(p => p.r === row && p.c === col);
        anatomyPaintMode.current = !alreadyHas;
        onToggleMemberPixel(row, col, !alreadyHas);
        lastPaintedCell.current = { r: row, c: col };
        return;
      }

      // Check if clicking on a bone line
      const compositeFrame = Array.from({ length: asset.size }, () => Array(asset.size).fill(0));
      asset.layers?.forEach(layer => {
        if (!layer.isVisible) return;
        const frame = layer.frames[frameIndex];
        if (frame) {
          for (let r = 0; r < asset.size; r++) {
            for (let c = 0; c < asset.size; c++) if (frame[r][c] !== 0) compositeFrame[r][c] = frame[r][c];
          }
        }
      });
      const segments = analyzeBodySegments(compositeFrame, asset.anatomy);
      
      const checkBone = (val: number, isVertical: boolean) => Math.abs((isVertical ? col : row) - val) < 0.8;
      
      if (checkBone(segments.neckRow, false)) setDraggingBone('neck');
      else if (checkBone(segments.waistRow, false)) setDraggingBone('waist');
      else if (checkBone(segments.torsoLeft, true)) setDraggingBone('torsoL');
      else if (checkBone(segments.torsoRight, true)) setDraggingBone('torsoR');
      else if (checkBone(segments.torsoCenterCol, true)) setDraggingBone('torsoC');
      else if (checkBone(segments.kneeRow, false)) setDraggingBone('knees');
      else if (checkBone(segments.ankleRow, false)) setDraggingBone('ankles');
      
      if (draggingBone) {
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }

    onPointerDown(row, col);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getPixelCoords(e.clientX, e.clientY, e.currentTarget, PIXEL_SCALE);
    if (!coords) return;
    const { row, col } = coords;
    setHoverCell({ r: row, c: col });

    if (isPanning.current && panStart.current && scrollStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const scrollContainer = e.currentTarget.parentElement?.parentElement;
      if (scrollContainer) {
        scrollContainer.scrollLeft = scrollStart.current.left - dx;
        scrollContainer.scrollTop = scrollStart.current.top - dy;
      }
      return;
    }

    if (draggingBone && onAnatomyChange) {
      const val = draggingBone.includes('L') || draggingBone.includes('R') || draggingBone.includes('C') ? col : row;
      const key = draggingBone === 'neck' ? 'neckRow' : draggingBone === 'waist' ? 'waistRow' : 
                  draggingBone === 'torsoL' ? 'torsoLeft' : draggingBone === 'torsoR' ? 'torsoRight' :
                  draggingBone === 'torsoC' ? 'torsoCenterCol' : draggingBone === 'knees' ? 'kneeRow' : 'ankleRow';
      onAnatomyChange({ [key]: Math.max(0, Math.min(asset.size - 1, val)) });
      return;
    }

    if (anatomyPaintMode.current !== null && anatomyIsSelectionMode && onToggleMemberPixel) {
      if (lastPaintedCell.current?.r === row && lastPaintedCell.current?.c === col) return;
      onToggleMemberPixel(row, col, anatomyPaintMode.current);
      lastPaintedCell.current = { r: row, c: col };
      return;
    }

    if (leftSidebarTab === 'anatomy' && !anatomyIsSelectionMode) {
      const compositeFrame = Array.from({ length: asset.size }, () => Array(asset.size).fill(0));
      asset.layers?.forEach(l => l.isVisible && l.frames[frameIndex]?.forEach((r, ri) => r.forEach((v, ci) => { if (v !== 0) compositeFrame[ri][ci] = v; })));
      const segments = analyzeBodySegments(compositeFrame, asset.anatomy);
      const checkBone = (val: number, isVertical: boolean) => Math.abs((isVertical ? col : row) - val) < 0.8;
      
      if (checkBone(segments.neckRow, false)) setHoveringBone('neck');
      else if (checkBone(segments.waistRow, false)) setHoveringBone('waist');
      else if (checkBone(segments.torsoLeft, true)) setHoveringBone('torsoL');
      else if (checkBone(segments.torsoRight, true)) setHoveringBone('torsoR');
      else if (checkBone(segments.torsoCenterCol, true)) setHoveringBone('torsoC');
      else if (checkBone(segments.kneeRow, false)) setHoveringBone('knees');
      else if (checkBone(segments.ankleRow, false)) setHoveringBone('ankles');
      else setHoveringBone(null);
    }

    onPointerMove(row, col);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    isPanning.current = false;
    panStart.current = null;
    scrollStart.current = null;
    setDraggingBone(null);
    anatomyPaintMode.current = null;
    lastPaintedCell.current = null;
    onPointerUp();
  };

  return { handlePointerDown, handlePointerMove, handlePointerUp };
}
