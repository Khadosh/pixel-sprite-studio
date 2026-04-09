import { SpriteEditorState } from './useSpriteEditorStore';
import { compositeFrame } from '@/lib/layerUtils';

/** Get the active layer object */
export const selectActiveLayer = (state: SpriteEditorState) =>
  state.editedAsset.layers.find(l => l.id === state.activeLayerId);

/** Get the total frame count */
export const selectFrameCount = (state: SpriteEditorState) =>
  state.editedAsset.layers[0]?.frames.length || state.editedAsset.frames?.length || 0;

/** Get visible frame indices based on viewing animation */
export const selectVisibleFramesIndices = (state: SpriteEditorState): number[] => {
  if (state.viewingAnimation === 'base' || state.editedAsset.animations.length === 0) {
    return [0];
  }
  const anim = state.editedAsset.animations.find(a => a.name === state.viewingAnimation);
  if (!anim) return [0];
  return [...new Set(anim.frameIndices)];
};

/** Get palette filtered to active layer (or all if showAllColors) */
export const selectFilteredPalette = (state: SpriteEditorState): Record<number, string> => {
  const activeLayer = selectActiveLayer(state);
  if (state.showAllColors || !activeLayer || !activeLayer.paletteIds) return state.editedAsset.palette;
  const filtered: Record<number, string> = { 0: 'transparent' };
  (activeLayer.paletteIds || []).forEach(id => {
    if (state.editedAsset.palette[id]) filtered[id] = state.editedAsset.palette[id];
  });
  return filtered;
};

/** Get onion ghost frames (prev/next composited frames at reduced opacity) */
export const selectOnionGhostFrames = (state: SpriteEditorState): { prev?: number[][]; next?: number[][] } => {
  if (!state.onionSkin) return { prev: undefined, next: undefined };
  const visibleIndices = selectVisibleFramesIndices(state);
  const currentIndex = visibleIndices.indexOf(state.editingFrameIndex);
  const prevIndex = currentIndex > 0 ? visibleIndices[currentIndex - 1] : -1;
  const nextIndex = currentIndex < visibleIndices.length - 1 ? visibleIndices[currentIndex + 1] : -1;
  return {
    prev: prevIndex >= 0 ? compositeFrame(state.editedAsset, prevIndex) : undefined,
    next: nextIndex >= 0 ? compositeFrame(state.editedAsset, nextIndex) : undefined,
  };
};

/** Get frame labels for the timeline */
export const selectFrameLabels = (state: SpriteEditorState): string[] => {
  const frameCount = selectFrameCount(state);
  const labels: string[] = frameCount > 0 ? Array.from({ length: frameCount }, (_, i) => `F${i}`) : [];

  for (const anim of state.editedAsset.animations) {
    const uniqueIndices = [...new Set(anim.frameIndices)];
    uniqueIndices.forEach((fi, seq) => {
      if (fi < labels.length) {
        labels[fi] = `${anim.label} ${seq + 1}`;
      }
    });
  }
  return labels;
};
