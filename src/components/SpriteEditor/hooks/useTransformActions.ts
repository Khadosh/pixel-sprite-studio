import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { SpriteAsset } from '@/lib/types';
import { flipHorizontal, flipVertical, rotate90 } from '@/lib/spriteTransforms';

export function useTransformActions(
  editedAsset: SpriteAsset,
  setEditedAsset: React.Dispatch<React.SetStateAction<SpriteAsset>>,
  editingFrameIndex: number,
  activeLayerId: string | null,
  viewingAnimation: string,
  scope: 'layer' | 'frame',
  overwriteLayerFrame: (pixels: number[][]) => void,
  selectionRect: { r: number, c: number, w: number, h: number } | null
) {
  const handleCopy = useCallback((setLayerClipboard: (pixels: number[][]) => void, setFrameClipboard: (clip: Record<string, number[][]>) => void) => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) {
        if (selectionRect) {
          // CLIP SELECTION
          const clip: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
          for (let ir = 0; ir < selectionRect.h; ir++) {
            for (let ic = 0; ic < selectionRect.w; ic++) {
              const r = selectionRect.r + ir;
              const c = selectionRect.c + ic;
              if (r >= 0 && r < editedAsset.size && c >= 0 && c < editedAsset.size) {
                clip[ir][ic] = frame[r][c];
              }
            }
          }
          setLayerClipboard(clip);
        } else {
          setLayerClipboard(frame.map(r => [...r]));
        }
      }
    } else {
      // Frame-level copy. (If we have a selection, technically we could clip all layers)
      // For now, let's keep frame copy as full-frame unless we want to be fancy.
      const clipboard: Record<string, number[][]> = {};
      editedAsset.layers.forEach(l => {
        const f = l.frames[editingFrameIndex];
        if (selectionRect) {
           const clip: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
           for (let ir = 0; ir < selectionRect.h; ir++) {
             for (let ic = 0; ic < selectionRect.w; ic++) {
               const r = selectionRect.r + ir;
               const c = selectionRect.c + ic;
               if (r >= 0 && r < editedAsset.size && c >= 0 && c < editedAsset.size) {
                 clip[ir][ic] = f[r][c];
               }
             }
           }
           clipboard[l.id] = clip;
        } else {
          clipboard[l.id] = f.map(r => [...r]);
        }
      });
      setFrameClipboard(clipboard);
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, selectionRect, editedAsset.size]);

  const handlePaste = useCallback((layerClipboard: number[][] | null, frameClipboard: Record<string, number[][]> | null) => {
    const size = editedAsset.size;
    const destR = selectionRect?.r || 0;
    const destC = selectionRect?.c || 0;

    if (scope === 'layer') {
      if (layerClipboard) {
        const baseFrame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
        if (baseFrame) {
          const newFrame = baseFrame.map(row => [...row]);
          const clipH = layerClipboard.length;
          const clipW = layerClipboard[0].length;
          
          for (let r = 0; r < clipH; r++) {
            for (let c = 0; c < clipW; c++) {
              const tr = destR + r;
              const tc = destC + c;
              if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
                const val = layerClipboard[r][c];
                if (val !== 0) newFrame[tr][tc] = val;
              }
            }
          }
          overwriteLayerFrame(newFrame);
        }
      }
    } else {
      if (frameClipboard) {
        setEditedAsset(prev => {
          const newLayers = prev.layers.map(l => {
            const clip = frameClipboard[l.id];
            if (clip) {
              const newFrames = [...l.frames];
              const baseF = l.frames[editingFrameIndex];
              const newF = baseF.map(row => [...row]);
              const clipH = clip.length;
              const clipW = clip[0].length;

              for (let r = 0; r < clipH; r++) {
                for (let c = 0; c < clipW; c++) {
                  const tr = destR + r;
                  const tc = destC + c;
                  if (tr >= 0 && tr < size && tc >= 0 && tc < size) {
                    const val = clip[r][c];
                    if (val !== 0) newF[tr][tc] = val;
                  }
                }
              }
              newFrames[editingFrameIndex] = newF;
              return { ...l, frames: newFrames };
            }
            return l;
          });
          return { ...prev, layers: newLayers };
        });
      }
    }
  }, [scope, overwriteLayerFrame, editingFrameIndex, setEditedAsset, editedAsset.layers, activeLayerId, editedAsset.size, selectionRect]);

  const handleFlipH = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (!frame) return;

      if (selectionRect) {
        const newFrame = frame.map(row => [...row]);
        const snippet: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
        
        // Extract
        for (let r = 0; r < selectionRect.h; r++) {
          for (let c = 0; c < selectionRect.w; c++) {
            snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
          }
        }
        // Flip snippet
        const flipped = snippet.map(row => [...row].reverse());
        // Solder
        for (let r = 0; r < selectionRect.h; r++) {
          for (let c = 0; c < selectionRect.w; c++) {
            newFrame[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
          }
        }
        overwriteLayerFrame(newFrame);
      } else {
        overwriteLayerFrame(flipHorizontal(frame));
      }
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const frame = l.frames[editingFrameIndex];
          const newFrames = [...l.frames];
          if (selectionRect) {
            const newF = frame.map(row => [...row]);
            const snippet = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
            for (let r = 0; r < selectionRect.h; r++) {
              for (let c = 0; c < selectionRect.w; c++) snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
            }
            const flipped = snippet.map(row => [...row].reverse());
            for (let r = 0; r < selectionRect.h; r++) {
              for (let c = 0; c < selectionRect.w; c++) newF[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
            }
            newFrames[editingFrameIndex] = newF;
          } else {
            newFrames[editingFrameIndex] = flipHorizontal(frame);
          }
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, overwriteLayerFrame, setEditedAsset, selectionRect]);

  const handleFlipV = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (!frame) return;

      if (selectionRect) {
        const newFrame = frame.map(row => [...row]);
        const snippet: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
        for (let r = 0; r < selectionRect.h; r++) {
          for (let c = 0; c < selectionRect.w; c++) {
            snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
          }
        }
        // Flip snippet vertically
        const flipped = [...snippet].reverse();
        for (let r = 0; r < selectionRect.h; r++) {
          for (let c = 0; c < selectionRect.w; c++) {
            newFrame[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
          }
        }
        overwriteLayerFrame(newFrame);
      } else {
        overwriteLayerFrame(flipVertical(frame));
      }
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const frame = l.frames[editingFrameIndex];
          const newFrames = [...l.frames];
          if (selectionRect) {
            const newF = frame.map(row => [...row]);
            const snippet = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
            for (let r = 0; r < selectionRect.h; r++) {
              for (let c = 0; c < selectionRect.w; c++) snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
            }
            const flipped = [...snippet].reverse();
            for (let r = 0; r < selectionRect.h; r++) {
              for (let c = 0; c < selectionRect.w; c++) newF[selectionRect.r + r][selectionRect.c + c] = flipped[r][c];
            }
            newFrames[editingFrameIndex] = newF;
          } else {
            newFrames[editingFrameIndex] = flipVertical(frame);
          }
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, overwriteLayerFrame, setEditedAsset, selectionRect]);

  const handleRotate = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (!frame) return;

      if (selectionRect) {
        // NOTE: Rotate 90 deg of a region is complex because it might change the rect dimensions
        // For simplicity and standard behavior, if it's square we rotate, if not we ignore or rotate anyway
        // and adjust the selectionRect.
        const snippet: number[][] = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
        for (let r = 0; r < selectionRect.h; r++) {
          for (let c = 0; c < selectionRect.w; c++) {
            snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
          }
        }
        
        const rotated = rotate90(snippet);
        const newFrame = frame.map(row => [...row]);
        
        // Clear old rect (snippet might have different size now)
        for (let r = 0; r < selectionRect.h; r++) {
          for (let c = 0; c < selectionRect.w; c++) {
            newFrame[selectionRect.r + r][selectionRect.c + c] = 0;
          }
        }
        
        // Paste rotated at center of old rect or top-left
        const newH = rotated.length;
        const newW = rotated[0].length;
        for (let r = 0; r < newH; r++) {
          for (let c = 0; c < newW; c++) {
            const tr = selectionRect.r + r;
            const tc = selectionRect.c + c;
            if (tr >= 0 && tr < editedAsset.size && tc >= 0 && tc < editedAsset.size) {
              newFrame[tr][tc] = rotated[r][c];
            }
          }
        }
        overwriteLayerFrame(newFrame);
        // We'd ideally return the new selectionRect to SpriteEditor hook to update it,
        // but since transformActions doesn't have setSelectionRect, we'll just clear the area.
      } else {
        overwriteLayerFrame(rotate90(frame));
      }
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const frame = l.frames[editingFrameIndex];
          const newFrames = [...l.frames];
          if (selectionRect) {
             const newF = frame.map(row => [...row]);
             const snippet = Array.from({ length: selectionRect.h }, () => Array(selectionRect.w).fill(0));
             for (let r = 0; r < selectionRect.h; r++) {
               for (let c = 0; c < selectionRect.w; c++) snippet[r][c] = frame[selectionRect.r + r][selectionRect.c + c];
             }
             const rotated = rotate90(snippet);
             for (let r = 0; r < selectionRect.h; r++) {
               for (let c = 0; c < selectionRect.w; c++) newF[selectionRect.r + r][selectionRect.c + c] = 0;
             }
             const newH = rotated.length;
             const newW = rotated[0].length;
             for (let r = 0; r < newH; r++) {
               for (let c = 0; c < newW; c++) {
                 const tr = selectionRect.r + r;
                 const tc = selectionRect.c + c;
                 if (tr >= 0 && tr < editedAsset.size && tc >= 0 && tc < editedAsset.size) newF[tr][tc] = rotated[r][c];
               }
             }
             newFrames[editingFrameIndex] = newF;
          } else {
            newFrames[editingFrameIndex] = rotate90(frame);
          }
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, overwriteLayerFrame, setEditedAsset, selectionRect, editedAsset.size]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeId = parseInt(active.id as string);
      const overId = parseInt(over.id as string);

      if (!isNaN(activeId) && !isNaN(overId)) {
        if (viewingAnimation === 'base') return;

        setEditedAsset(prev => {
          const animIndex = prev.animations.findIndex(a => a.name === viewingAnimation);
          if (animIndex === -1) return prev;
          const anim = prev.animations[animIndex];
          const oldTimelineIndex = anim.frameIndices.indexOf(activeId);
          const newTimelineIndex = anim.frameIndices.indexOf(overId);

          if (oldTimelineIndex !== -1 && newTimelineIndex !== -1) {
            const newFrameIndices = arrayMove(anim.frameIndices, oldTimelineIndex, newTimelineIndex);
            const newAnimations = [...prev.animations];
            newAnimations[animIndex] = { ...anim, frameIndices: newFrameIndices };
            return { ...prev, animations: newAnimations };
          }
          return prev;
        });
      }
    }
  };

  return {
    handleCopy,
    handlePaste,
    handleFlipH,
    handleFlipV,
    handleRotate,
    handleDragEnd
  };
}
