import { useState, useRef, useCallback } from 'react';
import type { Frame, SpriteAsset } from '@/lib/types';
import type { BrushSize } from '@/components/EditorToolbar';

import { shiftFrame, getCenterOfMass, rotateFrameFree } from '@/lib/spriteTransforms';
import { compositeFrame } from '@/lib/layerUtils';

export type EditorTool = 'pencil' | 'eraser' | 'fill' | 'picker' | 'line' | 'rect' | 'circle' | 'move' | 'rotate' | 'select';

export function usePixelEditor(
  asset: SpriteAsset,
  frameIndex: number,
  activeLayerId: string | null,
  onAssetChange: (a: SpriteAsset) => void,
  scope: 'layer' | 'frame' = 'layer'
) {
  const [tool, setTool] = useState<EditorTool>('pencil');
  const [activeColorKey, setActiveColorKey] = useState(1);
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const [mirrorX, setMirrorX] = useState(false);
  const [draftFrame, setDraftFrame] = useState<Frame | null>(null);
  const [moveOffset, setMoveOffset] = useState<{ dr: number; dc: number; activeLayerId?: string | null } | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number | null>(null);
  const [rotationCenter, setRotationCenter] = useState<{ r: number; c: number; activeLayerId?: string | null } | null>(null);
  const [initialRotationAngle, setInitialRotationAngle] = useState<number>(0);
  const [selectionRect, setSelectionRect] = useState<{ r: number; c: number; w: number; h: number } | null>(null);
  const [movingSelectionPixels, setMovingSelectionPixels] = useState<Frame | null>(null);

  const undoStack = useRef<Frame[]>([]);
  const [undoLen, setUndoLen] = useState(0);

  const isDrawing = useRef(false);
  const strokeStart = useRef<{ r: number; c: number } | null>(null);
  
  // To avoid redundant frame copies during pencil strokes
  const strokeMutableFrame = useRef<Frame | null>(null);

  const getActiveLayerFrame = useCallback(() => {
    if (!asset.layers || asset.layers.length === 0) return asset.frames?.[frameIndex] || null;
    const layer = asset.layers.find(l => l.id === activeLayerId) || asset.layers[0];
    return layer.frames[frameIndex] || null;
  }, [asset.layers, asset.frames, activeLayerId, frameIndex]);

  const updateActiveLayerFrame = useCallback((newFrame: Frame) => {
    if (!asset.layers || asset.layers.length === 0) {
      if (!asset.frames) return;
      const newFrames = [...asset.frames];
      newFrames[frameIndex] = newFrame;
      onAssetChange({ ...asset, frames: newFrames });
      return;
    }

    const newLayers = asset.layers.map(l => {
      if (l.id === activeLayerId || (!activeLayerId && l === asset.layers[0])) {
        const newFrames = [...l.frames];
        newFrames[frameIndex] = newFrame;
        return { ...l, frames: newFrames };
      }
      return l;
    });
    onAssetChange({ ...asset, layers: newLayers });
  }, [asset, activeLayerId, frameIndex, onAssetChange]);

  const pushUndo = useCallback(() => {
    const frame = getActiveLayerFrame();
    if (!frame) return;
    const snapshot = frame.map(row => [...row]);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > 50) undoStack.current.shift();
    setUndoLen(undoStack.current.length);
  }, [getActiveLayerFrame]);

  const undo = useCallback(() => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    setUndoLen(undoStack.current.length);
    updateActiveLayerFrame(snapshot);
  }, [updateActiveLayerFrame]);

  const applyPixelsToFrame = (frame: Frame, pixels: {r: number, c: number, v: number}[], size: number) => {
    for (const { r, c, v } of pixels) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        frame[r][c] = v;
      }
    }
  };

  const getSymmetricPixels = (r: number, c: number, v: number, size: number) => {
    const res = [{ r, c, v }];
    if (mirrorX) {
      const symC = size - 1 - c;
      if (symC !== c) res.push({ r, c: symC, v });
    }
    return res;
  };

  const expandBrush = (r: number, c: number, v: number, size: number) => {
    const side = brushSize === 1 ? 1 : brushSize === 4 ? 2 : 4;
    const pixels = [];
    for (let dr = 0; dr < side; dr++) {
      for (let dc = 0; dc < side; dc++) {
        pixels.push(...getSymmetricPixels(r + dr, c + dc, v, size));
      }
    }
    return pixels;
  };

  const getLinePixels = (r0: number, c0: number, r1: number, c1: number, v: number, size: number) => {
    const pixels: {r: number, c: number, v: number}[] = [];
    const dr = Math.abs(r1 - r0), sr = r0 < r1 ? 1 : -1;
    const dc = Math.abs(c1 - c0), sc = c0 < c1 ? 1 : -1;
    let err = (dc > dr ? dc : -dr) / 2, e2;

    let currR = r0, currC = c0;
    while (true) {
      pixels.push(...expandBrush(currR, currC, v, size));
      if (currR === r1 && currC === c1) break;
      e2 = err;
      if (e2 > -dc) { err -= dr; currC += sc; }
      if (e2 < dr) { err += dc; currR += sr; }
    }
    return pixels;
  };

  const getShapePixels = (type: string, sr: number, sc: number, cr: number, cc: number, v: number, size: number) => {
    if (type === 'line') return getLinePixels(sr, sc, cr, cc, v, size);
    
    const pixels: {r: number, c: number, v: number}[] = [];
    if (type === 'rect') {
      const minR = Math.min(sr, cr), maxR = Math.max(sr, cr);
      const minC = Math.min(sc, cc), maxC = Math.max(sc, cc);
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (r === minR || r === maxR || c === minC || c === maxC) {
            pixels.push(...expandBrush(r, c, v, size));
          }
        }
      }
    } else if (type === 'circle') {
      const radius = Math.max(Math.abs(cr - sr), Math.abs(cc - sc));
      for (let r = sr - radius; r <= sr + radius; r++) {
        for (let c = sc - radius; c <= sc + radius; c++) {
          const dist = Math.sqrt((r - sr)**2 + (c - sc)**2);
          if (Math.abs(dist - radius) < 0.5) {
            pixels.push(...expandBrush(r, c, v, size));
          }
        }
      }
    }
    return pixels;
  };

  const executeFloodFill = (startR: number, startC: number) => {
    const frame = getActiveLayerFrame();
    if (!frame) return;
    const targetColor = frame[startR][startC];
    const replacementColor = tool === 'eraser' ? 0 : activeColorKey;
    if (targetColor === replacementColor) return;

    const newFrame = frame.map(row => [...row]);
    const size = asset.size;
    const queue = [{ r: startR, c: startC }];
    
    while (queue.length > 0) {
      const { r, c } = queue.shift()!;
      if (r < 0 || r >= size || c < 0 || c >= size) continue;
      if (newFrame[r][c] !== targetColor) continue;
      
      newFrame[r][c] = replacementColor;
      queue.push({ r: r + 1, c }, { r: r - 1, c }, { r, c: c + 1 }, { r, c: c - 1 });
    }

    updateActiveLayerFrame(newFrame);
  };

  const handlePointerDown = useCallback((r: number, c: number, forceTool?: EditorTool) => {
    const frame = getActiveLayerFrame();
    if (!frame) return;
    
    const activeTool = forceTool || tool;
    
    if (activeTool === 'move') {
      strokeStart.current = { r, c };
      isDrawing.current = true;
      const f = getActiveLayerFrame();
      if (f) strokeMutableFrame.current = f.map(row => [...row]);
      return;
    }

    if (activeTool === 'rotate') {
      isDrawing.current = true;
      const baseFrame = scope === 'frame' ? compositeFrame(asset, frameIndex) : getActiveLayerFrame();
      const center = baseFrame ? getCenterOfMass(baseFrame) : { r: 7.5, c: 7.5 };
      const actualCenter = center || { r: 7.5, c: 7.5 };
      
      setRotationCenter({ ...actualCenter, activeLayerId: scope === 'layer' ? activeLayerId : null });
      const angle = Math.atan2(r - actualCenter.r, c - actualCenter.c);
      setInitialRotationAngle(angle);
      setRotationAngle(0);

      const f = getActiveLayerFrame();
      if (f) strokeMutableFrame.current = f.map(row => [...row]);
      return;
    }

    if (activeTool === 'select') {
      // Check if clicking inside existing selection
      if (selectionRect && r >= selectionRect.r && r < selectionRect.r + selectionRect.h && c >= selectionRect.c && c < selectionRect.c + selectionRect.w) {
        // START MOVING SELECTION
        pushUndo();
        isDrawing.current = true;
        strokeStart.current = { r, c };
        
        const pixels: Frame = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
        const newFrame = frame.map(row => [...row]);
        
        for (let ir = 0; ir < selectionRect.h; ir++) {
          for (let ic = 0; ic < selectionRect.w; ic++) {
            const fr = selectionRect.r + ir;
            const fc = selectionRect.c + ic;
            pixels[ir][ic] = frame[fr][fc];
            newFrame[fr][fc] = 0; // Clear original
          }
        }
        
        setMovingSelectionPixels(pixels);
        updateActiveLayerFrame(newFrame); // Update frame with cleared area
      } else {
        // START NEW SELECTION
        isDrawing.current = true;
        strokeStart.current = { r, c };
        setSelectionRect({ r, c, w: 1, h: 1 });
        setMovingSelectionPixels(null);
      }
      return;
    }

    if (activeTool === 'picker') {
      const colorId = frame[r][c];
      if (colorId !== 0) setActiveColorKey(colorId);
      return;
    }

    pushUndo();

    if (activeTool === 'fill') {
      executeFloodFill(r, c);
      return;
    }

    isDrawing.current = true;
    strokeStart.current = { r, c };

    const value = activeTool === 'eraser' ? 0 : activeColorKey;
    if (activeTool === 'pencil' || activeTool === 'eraser') {
      strokeMutableFrame.current = frame.map(row => [...row]);
      applyPixelsToFrame(strokeMutableFrame.current, expandBrush(r, c, value, asset.size), asset.size);
      updateActiveLayerFrame(strokeMutableFrame.current);
    } else {
      // Use -1 to represent 'empty/untouched draft space' since 0 is eraser transparency
      const emptyDraft = Array.from({ length: asset.size }, () => Array(asset.size).fill(-1));
      applyPixelsToFrame(emptyDraft, expandBrush(r, c, value, asset.size), asset.size);
      setDraftFrame(emptyDraft);
    }
  }, [tool, activeColorKey, asset, frameIndex, getActiveLayerFrame, updateActiveLayerFrame, brushSize, mirrorX, pushUndo, executeFloodFill, expandBrush, scope, selectionRect, movingSelectionPixels]);

  const handlePointerMove = useCallback((r: number, c: number, forceTool?: EditorTool) => {
    const activeTool = forceTool || tool;

    if (activeTool === 'move' && strokeStart.current) {
      const dr = r - strokeStart.current.r;
      const dc = c - strokeStart.current.c;
      setMoveOffset({ dr, dc, activeLayerId: scope === 'layer' ? activeLayerId : null });
      return;
    }

    if (activeTool === 'rotate' && rotationCenter) {
      const currentAngle = Math.atan2(r - rotationCenter.r, c - rotationCenter.c);
      const diff = ((currentAngle - initialRotationAngle) * 180) / Math.PI;
      setRotationAngle(diff);
      return;
    }

    if (activeTool === 'select' && strokeStart.current) {
      if (movingSelectionPixels) {
        // MOVE EXISTING SELECTION
        const dr = r - strokeStart.current.r;
        const dc = c - strokeStart.current.c;
        setSelectionRect(prev => prev ? { ...prev, r: prev.r + dr, c: prev.c + dc } : null);
        strokeStart.current = { r, c };
      } else {
        // DRAW NEW SELECTION RECT
        const minR = Math.min(strokeStart.current.r, r);
        const maxR = Math.max(strokeStart.current.r, r);
        const minC = Math.min(strokeStart.current.c, c);
        const maxC = Math.max(strokeStart.current.c, c);
        setSelectionRect({
          r: minR,
          c: minC,
          w: maxC - minC + 1,
          h: maxR - minR + 1
        });
      }
      return;
    }

    const frame = getActiveLayerFrame();
    if (!isDrawing.current || !strokeStart.current || !frame) return;

    const value = activeTool === 'eraser' ? 0 : activeColorKey;

    if (activeTool === 'pencil' || activeTool === 'eraser') {
      if (strokeMutableFrame.current) {
        applyPixelsToFrame(strokeMutableFrame.current, getLinePixels(strokeStart.current.r, strokeStart.current.c, r, c, value, asset.size), asset.size);
        strokeStart.current = { r, c }; 

        updateActiveLayerFrame([...strokeMutableFrame.current.map(row => [...row])]);
      }
    } else {
      const shapeDraft = Array.from({ length: asset.size }, () => Array(asset.size).fill(-1));
      const pixels = getShapePixels(activeTool as string, strokeStart.current.r, strokeStart.current.c, r, c, value, asset.size);
      applyPixelsToFrame(shapeDraft, pixels, asset.size);
      setDraftFrame(shapeDraft);
    }
  }, [
    tool, activeColorKey, asset.size, getActiveLayerFrame, updateActiveLayerFrame, 
    brushSize, mirrorX, getLinePixels, getShapePixels, activeLayerId, scope, 
    rotationCenter, initialRotationAngle, selectionRect, movingSelectionPixels
  ]);

  const overwriteLayerFrame = useCallback((newFrame: Frame) => {
    pushUndo(); // Save current state before overwriting
    updateActiveLayerFrame(newFrame);
  }, [updateActiveLayerFrame, pushUndo]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;

    if (tool === 'rotate' && rotationCenter && rotationAngle !== null) {
      const initial = strokeMutableFrame.current;
      if (initial) {
        if (scope === 'layer') {
          overwriteLayerFrame(rotateFrameFree(initial, rotationAngle, rotationCenter));
        } else {
          // Rotate ALL layers
          pushUndo();
          onAssetChange({
            ...asset,
            layers: asset.layers.map(l => {
              const newFrames = [...l.frames];
              newFrames[frameIndex] = rotateFrameFree(l.frames[frameIndex], rotationAngle, rotationCenter);
              return { ...l, frames: newFrames };
            })
          });
        }
      }
      isDrawing.current = false;
      setRotationAngle(null);
      setRotationCenter(null);
      strokeMutableFrame.current = null;
      return;
    }

    if (tool === 'move' && strokeStart.current) {
      const dr = moveOffset?.dr || 0;
      const dc = moveOffset?.dc || 0;
      const initial = strokeMutableFrame.current;
      
      if (initial && (dr !== 0 || dc !== 0)) {
        if (scope === 'layer') {
          overwriteLayerFrame(shiftFrame(initial, dr, dc));
        } else {
          // Move ALL layers
          pushUndo();
          onAssetChange({
            ...asset,
            layers: asset.layers.map(l => {
              const newFrames = [...l.frames];
              newFrames[frameIndex] = shiftFrame(l.frames[frameIndex], dr, dc);
              return { ...l, frames: newFrames };
            })
          });
        }
      }
      isDrawing.current = false;
      strokeStart.current = null;
      strokeMutableFrame.current = null;
      setMoveOffset(null);
      return;
    }

    if (tool === 'select') {
      if (movingSelectionPixels && selectionRect) {
        // STAMP MOVING SELECTION
        const baseFrame = getActiveLayerFrame();
        if (baseFrame) {
          const mergedFrame = baseFrame.map(row => [...row]);
          for (let ir = 0; ir < selectionRect.h; ir++) {
            for (let ic = 0; ic < selectionRect.w; ic++) {
              const tr = selectionRect.r + ir;
              const tc = selectionRect.c + ic;
              if (tr >= 0 && tr < asset.size && tc >= 0 && tc < asset.size) {
                const val = movingSelectionPixels[ir][ic];
                if (val !== 0) mergedFrame[tr][tc] = val;
              }
            }
          }
          overwriteLayerFrame(mergedFrame);
        }
        setMovingSelectionPixels(null);
      }
      isDrawing.current = false;
      return;
    }

    if ((tool === 'rect' || tool === 'circle' || tool === 'line') && draftFrame) {
      const baseFrame = getActiveLayerFrame();
      if (!baseFrame) return;
      
      const mergedFrame = baseFrame.map((row, rr) => 
        row.map((col, cc) => {
          const draftVal = draftFrame[rr][cc];
          return draftVal !== -1 ? draftVal : col;
        })
      );
      updateActiveLayerFrame(mergedFrame);
      setDraftFrame(null);
    }
    
    isDrawing.current = false;
    strokeMutableFrame.current = null;
    strokeStart.current = null;
  }, [tool, draftFrame, getActiveLayerFrame, updateActiveLayerFrame, moveOffset, asset, frameIndex, onAssetChange, scope, overwriteLayerFrame, pushUndo, rotationAngle, rotationCenter]);
  
  return {
    tool, setTool,
    activeColorKey, setActiveColorKey,
    brushSize, setBrushSize,
    mirrorX, setMirrorX,
    draftFrame,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, pushUndo, canUndo: undoLen > 0,
    overwriteLayerFrame,
    rotationAngle,
    rotationCenter,
    selectionRect,
    setSelectionRect,
    movingSelectionPixels,
  };
}
