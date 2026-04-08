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
  overwriteLayerFrame: (pixels: number[][]) => void
) {
  const handleCopy = useCallback((setLayerClipboard: (pixels: number[][]) => void, setFrameClipboard: (clip: Record<string, number[][]>) => void) => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) setLayerClipboard(frame.map(r => [...r]));
    } else {
      const clipboard: Record<string, number[][]> = {};
      editedAsset.layers.forEach(l => {
        clipboard[l.id] = l.frames[editingFrameIndex].map(r => [...r]);
      });
      setFrameClipboard(clipboard);
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex]);

  const handlePaste = useCallback((layerClipboard: number[][] | null, frameClipboard: Record<string, number[][]> | null) => {
    if (scope === 'layer') {
      if (layerClipboard) overwriteLayerFrame(layerClipboard.map(r => [...r]));
    } else {
      if (frameClipboard) {
        setEditedAsset(prev => {
          const newLayers = prev.layers.map(l => {
            if (frameClipboard[l.id]) {
              const newFrames = [...l.frames];
              newFrames[editingFrameIndex] = frameClipboard[l.id].map(r => [...r]);
              return { ...l, frames: newFrames };
            }
            return l;
          });
          return { ...prev, layers: newLayers };
        });
      }
    }
  }, [scope, overwriteLayerFrame, editingFrameIndex, setEditedAsset]);

  const handleFlipH = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(flipHorizontal(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = flipHorizontal(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, overwriteLayerFrame, setEditedAsset]);

  const handleFlipV = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(flipVertical(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = flipVertical(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, overwriteLayerFrame, setEditedAsset]);

  const handleRotate = useCallback(() => {
    if (scope === 'layer') {
      const frame = editedAsset.layers.find(l => l.id === activeLayerId)?.frames[editingFrameIndex];
      if (frame) overwriteLayerFrame(rotate90(frame));
    } else {
      setEditedAsset(prev => ({
        ...prev,
        layers: prev.layers.map(l => {
          const newFrames = [...l.frames];
          newFrames[editingFrameIndex] = rotate90(l.frames[editingFrameIndex]);
          return { ...l, frames: newFrames };
        })
      }));
    }
  }, [scope, editedAsset.layers, activeLayerId, editingFrameIndex, overwriteLayerFrame, setEditedAsset]);

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
