import type { Frame, SpriteAsset, SpriteLayer } from './types';

/**
 * Composites all visible layers for a specific frame index into a single Frame.
 * Top-most layers (higher index in the array) override lower layers.
 */
export function compositeFrame(asset: SpriteAsset, frameIndex: number): Frame {
  const size = asset.size;
  const result: Frame = Array.from({ length: size }, () => Array(size).fill(0));

  // Iterate from bottom to top (index 0 is bottom)
  for (const layer of asset.layers) {
    if (!layer.isVisible || layer.opacity === 0) continue;
    
    const frame = layer.frames[frameIndex];
    if (!frame) continue;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = frame[r][c];
        if (val !== 0) {
          // In a simple palette system, we just take the top-most non-zero value.
          // In the future, if we want real alpha blending, we'd need to convert to RGBA.
          result[r][c] = val;
        }
      }
    }
  }

  return result;
}

/**
 * Ensures a SpriteAsset has at least one layer and migrates legacy 'frames' if needed.
 */
export function ensureLayerSupport(asset: SpriteAsset): SpriteAsset {
  if (asset.layers && asset.layers.length > 0) {
    return asset;
  }

  // Migrate legacy frames
  const legacyFrames = asset.frames || [];
  const baseLayer: SpriteLayer = {
    id: 'layer-base',
    name: 'Base',
    isVisible: true,
    isLocked: false,
    opacity: 1,
    frames: legacyFrames,
  };

  return {
    ...asset,
    layers: [baseLayer],
    // Clean up legacy frames on the object but it might still be in the DB
    frames: undefined, 
  };
}

/**
 * Creates a new empty frame for all layers in the asset at a specific index.
 */
export function addEmptyFrameToAllLayers(asset: SpriteAsset, frameIndex: number): SpriteAsset {
  const size = asset.size;
  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    const emptyFrame = Array.from({ length: size }, () => Array(size).fill(0));
    newFrames.splice(frameIndex + 1, 0, emptyFrame);
    return { ...layer, frames: newFrames };
  });

  return {
    ...asset,
    layers: newLayers
  };
}

/**
 * Removes a frame index from all layers.
 */
export function removeFrameFromAllLayers(asset: SpriteAsset, frameIndex: number): SpriteAsset {
  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    newFrames.splice(frameIndex, 1);
    return { ...layer, frames: newFrames };
  });

  return {
    ...asset,
    layers: newLayers
  };
}

/**
 * Duplicates a frame index in all layers.
 */
export function duplicateFrameInAllLayers(asset: SpriteAsset, frameIndex: number): SpriteAsset {
  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    // Deep clone the frame matrix
    const frameToCopy = layer.frames[frameIndex];
    const newFrame = frameToCopy.map(row => [...row]);
    newFrames.splice(frameIndex + 1, 0, newFrame);
    return { ...layer, frames: newFrames };
  });

  return {
    ...asset,
    layers: newLayers
  };
}
