import { useState, useRef, useCallback } from 'react';
import type { Frame, SpriteAsset } from '@/lib/types';
import type { BrushSize } from '@/components/EditorToolbar';

export type EditorTool = 'pencil' | 'eraser' | 'fill' | 'picker' | 'line' | 'rect' | 'circle';

export function usePixelEditor(
  asset: SpriteAsset,
  frameIndex: number,
  onAssetChange: (a: SpriteAsset) => void,
) {
  const [tool, setTool] = useState<EditorTool>('pencil');
  const [activeColorKey, setActiveColorKey] = useState(1);
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const [mirrorX, setMirrorX] = useState(false);
  const [draftFrame, setDraftFrame] = useState<Frame | null>(null);

  const undoStack = useRef<Frame[]>([]);
  const [undoLen, setUndoLen] = useState(0);

  const isDrawing = useRef(false);
  const strokeStart = useRef<{ r: number; c: number } | null>(null);
  
  // To avoid redundant frame copies during pencil strokes
  const strokeMutableFrame = useRef<Frame | null>(null);

  const pushUndo = useCallback(() => {
    if (!asset.frames[frameIndex]) return;
    const frame = asset.frames[frameIndex];
    const snapshot = frame.map(row => [...row]);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > 50) undoStack.current.shift();
    setUndoLen(undoStack.current.length);
  }, [asset, frameIndex]);

  const undo = useCallback(() => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    setUndoLen(undoStack.current.length);

    const newFrames = [...asset.frames];
    newFrames[frameIndex] = snapshot;
    onAssetChange({ ...asset, frames: newFrames });
  }, [asset, frameIndex, onAssetChange]);

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
    let dr = Math.abs(r1 - r0), sr = r0 < r1 ? 1 : -1;
    let dc = Math.abs(c1 - c0), sc = c0 < c1 ? 1 : -1;
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
    const frame = asset.frames[frameIndex];
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

    const newFrames = [...asset.frames];
    newFrames[frameIndex] = newFrame;
    onAssetChange({ ...asset, frames: newFrames });
  };

  const handlePointerDown = useCallback((r: number, c: number) => {
    if (!asset.frames[frameIndex]) return;
    
    if (tool === 'picker') {
      const colorId = asset.frames[frameIndex][r][c];
      if (colorId !== 0) setActiveColorKey(colorId);
      return;
    }

    pushUndo();

    if (tool === 'fill') {
      executeFloodFill(r, c);
      return;
    }

    isDrawing.current = true;
    strokeStart.current = { r, c };

    const value = tool === 'eraser' ? 0 : activeColorKey;

    if (tool === 'pencil' || tool === 'eraser') {
      strokeMutableFrame.current = asset.frames[frameIndex].map(row => [...row]);
      applyPixelsToFrame(strokeMutableFrame.current, expandBrush(r, c, value, asset.size), asset.size);
      
      const newFrames = [...asset.frames];
      newFrames[frameIndex] = strokeMutableFrame.current;
      onAssetChange({ ...asset, frames: newFrames });
    } else {
      // Use -1 to represent 'empty/untouched draft space' since 0 is eraser transparency
      const emptyDraft = Array.from({ length: asset.size }, () => Array(asset.size).fill(-1));
      applyPixelsToFrame(emptyDraft, expandBrush(r, c, value, asset.size), asset.size);
      setDraftFrame(emptyDraft);
    }
  }, [tool, activeColorKey, asset, frameIndex, brushSize, mirrorX, pushUndo]);

  const handlePointerMove = useCallback((r: number, c: number) => {
    if (!isDrawing.current || !strokeStart.current || !asset.frames[frameIndex]) return;

    const value = tool === 'eraser' ? 0 : activeColorKey;

    if (tool === 'pencil' || tool === 'eraser') {
      if (strokeMutableFrame.current) {
        applyPixelsToFrame(strokeMutableFrame.current, getLinePixels(strokeStart.current.r, strokeStart.current.c, r, c, value, asset.size), asset.size);
        strokeStart.current = { r, c }; 

        const newFrames = [...asset.frames];
        newFrames[frameIndex] = [...strokeMutableFrame.current.map(row => [...row])];
        onAssetChange({ ...asset, frames: newFrames });
      }
    } else {
      const shapeDraft = Array.from({ length: asset.size }, () => Array(asset.size).fill(-1));
      const pixels = getShapePixels(tool, strokeStart.current.r, strokeStart.current.c, r, c, value, asset.size);
      applyPixelsToFrame(shapeDraft, pixels, asset.size);
      setDraftFrame(shapeDraft);
    }
  }, [tool, activeColorKey, asset, frameIndex, brushSize, mirrorX]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if ((tool === 'rect' || tool === 'circle' || tool === 'line') && draftFrame) {
      if (!asset.frames[frameIndex]) return;
      const baseFrame = asset.frames[frameIndex];
      const mergedFrame = baseFrame.map((row, rr) => 
        row.map((col, cc) => {
          const draftVal = draftFrame[rr][cc];
          return draftVal !== -1 ? draftVal : col;
        })
      );
      const newFrames = [...asset.frames];
      newFrames[frameIndex] = mergedFrame;
      onAssetChange({ ...asset, frames: newFrames });
      setDraftFrame(null);
    }
    
    strokeMutableFrame.current = null;
    strokeStart.current = null;
  }, [tool, draftFrame, asset, frameIndex, onAssetChange]);
  
  return {
    tool, setTool,
    activeColorKey, setActiveColorKey,
    brushSize, setBrushSize,
    mirrorX, setMirrorX,
    draftFrame,
    handlePointerDown, handlePointerMove, handlePointerUp,
    undo, pushUndo, canUndo: undoLen > 0,
  };
}
