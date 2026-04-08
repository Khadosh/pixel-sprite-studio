import { useCallback, useMemo } from 'react';
import { SpriteAsset } from '@/lib/types';
import { duplicateFrameInAllLayers, removeFrameFromAllLayers, addEmptyFrameToAllLayers } from '@/lib/spriteAnimations';

export function useFrameActions(
  editedAsset: SpriteAsset,
  setEditedAsset: React.Dispatch<React.SetStateAction<SpriteAsset>>,
  editingFrameIndex: number,
  setEditingFrameIndex: (index: number) => void
) {
  const handleDuplicateFrame = useCallback((idx: number) => {
    setEditedAsset(prev => duplicateFrameInAllLayers(prev, idx));
  }, [setEditedAsset]);

  const handleDeleteFrame = useCallback((idx: number) => {
    if (editingFrameIndex === idx) setEditingFrameIndex(Math.max(0, idx - 1));
    else if (editingFrameIndex > idx) setEditingFrameIndex(editingFrameIndex - 1);
    setEditedAsset(prev => removeFrameFromAllLayers(prev, idx));
  }, [editingFrameIndex, setEditingFrameIndex, setEditedAsset]);

  const handleInsertEmptyFrame = useCallback((idx: number) => {
    setEditedAsset(prev => addEmptyFrameToAllLayers(prev, idx));
  }, [setEditedAsset]);

  const frameLabels = useMemo(() => {
    const frameCount = editedAsset.layers[0]?.frames.length || editedAsset.frames?.length || 0;
    const labels: string[] = frameCount > 0 ? Array.from({ length: frameCount }, (_, i) => `F${i}`) : [];
    
    for (const anim of editedAsset.animations) {
      const uniqueIndices = [...new Set(anim.frameIndices)];
      uniqueIndices.forEach((fi, seq) => {
        if (fi < labels.length) {
          labels[fi] = `${anim.label} ${seq + 1}`;
        }
      });
    }
    return labels;
  }, [editedAsset.animations, editedAsset.layers, editedAsset.frames]);

  return {
    handleDuplicateFrame,
    handleDeleteFrame,
    handleInsertEmptyFrame,
    frameLabels
  };
}
