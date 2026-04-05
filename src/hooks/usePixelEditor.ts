import { useState, useRef, useCallback } from 'react';
import type { Frame, SpriteAsset } from '@/lib/types';
import type { BrushSize } from '@/components/EditorToolbar';

export type EditorTool = 'pencil' | 'eraser';

export function usePixelEditor(
  asset: SpriteAsset,
  frameIndex: number,
  onAssetChange: (a: SpriteAsset) => void,
) {
  const [tool, setTool] = useState<EditorTool>('pencil');
  const [activeColorKey, setActiveColorKey] = useState(1);
  const [brushSize, setBrushSize] = useState<BrushSize>(1);
  const undoStack = useRef<Frame[]>([]);
  const [undoLen, setUndoLen] = useState(0);

  const pushUndo = useCallback(() => {
    if (!asset.frames[frameIndex]) return;
    const frame = asset.frames[frameIndex];
    const snapshot = frame.map(row => [...row]);
    undoStack.current.push(snapshot);
    if (undoStack.current.length > 50) undoStack.current.shift();
    setUndoLen(undoStack.current.length);
  }, [asset, frameIndex]);

  const fillArea = useCallback((row: number, col: number, value: number) => {
    if (!asset.frames[frameIndex]) return;
    const currentFrame = asset.frames[frameIndex];
    const newFrame = currentFrame.map(r => [...r]);
    const side = brushSize === 1 ? 1 : brushSize === 4 ? 2 : 4;
    let changed = false;

    for (let dr = 0; dr < side; dr++) {
      for (let dc = 0; dc < side; dc++) {
        const r = row + dr, c = col + dc;
        if (r >= 0 && r < asset.size && c >= 0 && c < asset.size && newFrame[r][c] !== value) {
          newFrame[r][c] = value;
          changed = true;
        }
      }
    }

    if (!changed) return;

    const newFrames = [...asset.frames];
    newFrames[frameIndex] = newFrame;
    onAssetChange({ ...asset, frames: newFrames });
  }, [asset, frameIndex, brushSize, onAssetChange]);

  const paintPixel = useCallback((row: number, col: number) => {
    fillArea(row, col, tool === 'eraser' ? 0 : activeColorKey);
  }, [fillArea, tool, activeColorKey]);

  const erasePixel = useCallback((row: number, col: number) => {
    fillArea(row, col, 0);
  }, [fillArea]);

  const undo = useCallback(() => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    setUndoLen(undoStack.current.length);

    const newFrames = [...asset.frames];
    newFrames[frameIndex] = snapshot;
    onAssetChange({ ...asset, frames: newFrames });
  }, [asset, frameIndex, onAssetChange]);

  return {
    tool, setTool,
    activeColorKey, setActiveColorKey,
    brushSize, setBrushSize,
    paintPixel, erasePixel,
    pushUndo, undo,
    canUndo: undoLen > 0,
  };
}
