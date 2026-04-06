import type { SpriteAsset, AnimationDef, SpriteLayer, Frame } from '@/lib/types';
import { ensureLayerSupport } from '@/lib/layerUtils';
import {
  generateIdle,
  generateWalk,
  generateCast,
  generateHurt,
  shiftDown,
  shiftRight,
} from '@/lib/spriteTransforms';

/**
 * Takes a SpriteAsset and generates animation frames client-side.
 * Returns a new SpriteAsset with all layers updated and animation definitions.
 */
export function generateAnimationsClientSide(
  asset: SpriteAsset,
  animationNames: string[],
): SpriteAsset {
  // Create a deep copy of the layers to modify them
  const newLayers: SpriteLayer[] = asset.layers.map(layer => ({
    ...layer,
    frames: layer.frames.map(f => f.map(r => [...r]))
  }));
  
  const paletteKeys = Object.keys(asset.palette).map(Number).filter(k => k > 0);
  const glowColor = Math.max(...paletteKeys);

  // We start with the existing animations
  const animDefs: AnimationDef[] = asset.animations.map(a => ({ ...a }));

  for (const animName of animationNames) {
    // Generate for all layers based on their own frame 0
    // Note: We use the *cloned* frame 0 from newLayers
    const startIndex = newLayers[0].frames.length;
    
    newLayers.forEach(layer => {
      // f0 and f1 are the new frames based on this layer's base frame
      const [f0, f1] = generateFramePair(layer.frames[0], animName, glowColor);
      
      // Add 4 frames for the 4-frame animation sequence
      layer.frames.push(
        f0, 
        f1, 
        f0.map(r => [...r]), 
        f1.map(r => [...r])
      );
    });

    const fps = animName === 'idle' ? 3 : animName === 'cast' ? 4 : 5;
    const newAnimDef: AnimationDef = {
      name: animName,
      label: animName.toUpperCase(),
      frameIndices: [startIndex, startIndex + 1, startIndex + 2, startIndex + 3],
      fps,
    };

    // Replace if exists, else push
    const existingIdx = animDefs.findIndex(a => a.name === animName);
    if (existingIdx >= 0) {
      animDefs[existingIdx] = newAnimDef;
    } else {
      animDefs.push(newAnimDef);
    }
  }

  return {
    ...asset,
    layers: newLayers,
    animations: animDefs,
  };
}

function generateFramePair(
  base: number[][],
  anim: string,
  glowColor: number,
): [number[][], number[][]] {
  switch (anim) {
    case 'idle':
      return generateIdle(base);
    case 'walk':
      return generateWalk(base);
    case 'attack':
      return [base.map(r => [...r]), shiftRight(base, 1)];
    case 'cast':
      return generateCast(base, glowColor);
    case 'hurt':
      return generateHurt(base);
    case 'jump':
      return [base.map(r => [...r]), shiftDown(base, -1)];
    default:
      return generateIdle(base);
  }
}

/**
 * Injects 3 externally generated frames (e.g. from AI) into a SpriteAsset
 * to form a 4-frame animation (baseFrame + 3 new frames).
 * AI frames are injected ONLY into the first layer.
 */
export function addExternalAnimation(
  asset: SpriteAsset,
  animationName: string,
  newFrames: number[][][],
  targetLayerId?: string | null,
): SpriteAsset {
  if (newFrames.length !== 3) {
    throw new Error('addExternalAnimation expects exactly 3 new frames');
  }

  const layeredAsset = ensureLayerSupport(asset);
  
  // Find which layer to inject into
  let targetIdx = 0;
  if (targetLayerId) {
    const found = layeredAsset.layers.findIndex(l => l.id === targetLayerId);
    if (found >= 0) targetIdx = found;
  } else {
    // Fallback: search for "Base" or "Main"
    const baseIdx = layeredAsset.layers.findIndex(l => l.name.toLowerCase().includes('base') || l.name.toLowerCase().includes('main'));
    if (baseIdx >= 0) targetIdx = baseIdx;
  }

  const startIndex = layeredAsset.layers[0].frames.length;
  const newLayers = layeredAsset.layers.map((layer, idx) => {
    const frames = [...layer.frames];
    if (idx === targetIdx) {
      frames.push(...newFrames);
    } else {
      // Add empty frames to other layers to maintain alignment
      for (let i = 0; i < 3; i++) {
        frames.push(Array.from({ length: layeredAsset.size }, () => Array(layeredAsset.size).fill(0)));
      }
    }
    return { ...layer, frames };
  });

  const fps = animationName === 'idle' ? 3 : animationName === 'cast' ? 4 : 5;
  const newAnimation: AnimationDef = {
    name: animationName,
    label: animationName.toUpperCase(),
    frameIndices: [0, startIndex, startIndex + 1, startIndex + 2],
    fps,
  };

  const animations = [...layeredAsset.animations];
  const existingIdx = animations.findIndex(a => a.name === animationName);
  
  if (existingIdx >= 0) {
    animations[existingIdx] = newAnimation;
  } else {
    animations.push(newAnimation);
  }

  return {
    ...layeredAsset,
    layers: newLayers,
    animations,
  };
}

/**
 * Duplicates the frame index in all layers.
 */
export function duplicateFrameInAllLayers(asset: SpriteAsset, targetIdx: number): SpriteAsset {
  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    const frameToCopy = newFrames[targetIdx].map(row => [...row]);
    newFrames.splice(targetIdx + 1, 0, frameToCopy);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.flatMap(oldIdx => {
      if (oldIdx === targetIdx) return [oldIdx, targetIdx + 1];
      return oldIdx > targetIdx ? oldIdx + 1 : oldIdx;
    })
  }));

  return { ...asset, layers: newLayers, animations: newAnimations };
}

/**
 * Adds an empty frame after the specified index in all layers.
 */
export function addEmptyFrameToAllLayers(asset: SpriteAsset, afterIdx: number): SpriteAsset {
  const size = asset.size;
  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    const emptyFrame = Array.from({ length: size }, () => Array(size).fill(0));
    newFrames.splice(afterIdx + 1, 0, emptyFrame);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.flatMap(oldIdx => {
      if (oldIdx === afterIdx) return [oldIdx, afterIdx + 1];
      return oldIdx > afterIdx ? oldIdx + 1 : oldIdx;
    })
  }));

  return { ...asset, layers: newLayers, animations: newAnimations };
}

/**
 * Removes a frame index from all layers.
 */
export function removeFrameFromAllLayers(asset: SpriteAsset, targetIdx: number): SpriteAsset {
  const firstLayer = asset.layers[0];
  if (firstLayer.frames.length <= 1) return asset;

  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    newFrames.splice(targetIdx, 1);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => {
    const validIndices = anim.frameIndices.filter(oldIdx => oldIdx !== targetIdx);
    return {
      ...anim,
      frameIndices: validIndices.map(oldIdx => oldIdx > targetIdx ? oldIdx - 1 : oldIdx)
    };
  });

  return { ...asset, layers: newLayers, animations: newAnimations };
}

/**
 * Moves a frame from one index to another, updating all layers.
 */
export function moveFrame(asset: SpriteAsset, fromIdx: number, toIdx: number): SpriteAsset {
  const frameCount = asset.layers[0]?.frames.length || 0;
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= frameCount || toIdx >= frameCount) {
    return asset;
  }

  const newLayers = asset.layers.map(layer => {
    const newFrames = [...layer.frames];
    const [movedFrame] = newFrames.splice(fromIdx, 1);
    newFrames.splice(toIdx, 0, movedFrame);
    return { ...layer, frames: newFrames };
  });

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.map(oldIdx => {
      if (oldIdx === fromIdx) return toIdx;
      if (fromIdx > toIdx) { // Moved left
        if (oldIdx >= toIdx && oldIdx < fromIdx) return oldIdx + 1;
      } else { // Moved right
        if (oldIdx > fromIdx && oldIdx <= toIdx) return oldIdx - 1;
      }
      return oldIdx;
    })
  }));

  return { ...asset, layers: newLayers, animations: newAnimations };
}
