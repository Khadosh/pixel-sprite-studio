import type { SpriteAsset, AnimationDef } from '@/lib/types';
import {
  generateIdle,
  generateWalk,
  generateCast,
  generateHurt,
  shiftDown,
  shiftRight,
} from '@/lib/spriteTransforms';

/**
 * Takes a SpriteAsset with 1 base frame and generates animation frames client-side.
 * Returns a new SpriteAsset with all frames and animation definitions.
 */
export function generateAnimationsClientSide(
  asset: SpriteAsset,
  animationNames: string[],
): SpriteAsset {
  const baseFrame = asset.frames[0];
  const paletteKeys = Object.keys(asset.palette).map(Number).filter(k => k > 0);
  const glowColor = Math.max(...paletteKeys);

  const allFrames: number[][][] = [baseFrame.map(r => [...r])];
  const animDefs: AnimationDef[] = [];

  const existingAnimMap = new Map(asset.animations.map(a => [a.name, a]));
  // We process all animations that are either already existing or explicitly requested to be generated
  const allAnimNamesToProcess = [...new Set([...asset.animations.map(a => a.name), ...animationNames])];

  for (const animName of allAnimNamesToProcess) {
    if (animationNames.includes(animName)) {
      // Regenerate unconditionally
      const fi = allFrames.length;
      const [f0, f1] = generateFramePair(baseFrame, animName, glowColor);
      allFrames.push(
        f0, 
        f1, 
        f0.map(r => [...r]), 
        f1.map(r => [...r])
      );

      const fps = animName === 'idle' ? 3 : animName === 'cast' ? 4 : 5;
      animDefs.push({
        name: animName,
        label: animName.toUpperCase(),
        frameIndices: [fi, fi + 1, fi + 2, fi + 3],
        fps,
      });
    } else {
      // Keep existing (don't regenerate)
      const oldAnim = existingAnimMap.get(animName);
      if (oldAnim) {
        const newIndices: number[] = [];
        const indexMapping = new Map<number, number>();

        for (const oldIdx of oldAnim.frameIndices) {
          if (!indexMapping.has(oldIdx)) {
            indexMapping.set(oldIdx, allFrames.length);
            allFrames.push(asset.frames[oldIdx].map(r => [...r]));
          }
          newIndices.push(indexMapping.get(oldIdx)!);
        }

        animDefs.push({
          ...oldAnim,
          frameIndices: newIndices,
        });
      }
    }
  }

  return {
    ...asset,
    frames: allFrames,
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
 */
export function addExternalAnimation(
  asset: SpriteAsset,
  animationName: string,
  newFrames: number[][][],
): SpriteAsset {
  // If the API returned exactly 3 frames
  if (newFrames.length !== 3) {
    throw new Error('addExternalAnimation expects exactly 3 new frames');
  }

  const frames = [...asset.frames];
  const startIndex = frames.length;

  frames.push(...newFrames);

  const fps = animationName === 'idle' ? 3 : animationName === 'cast' ? 4 : 5;
  const newAnimation: AnimationDef = {
    name: animationName,
    label: animationName.toUpperCase(),
    // Base frame (0) followed by the 3 new frames
    frameIndices: [0, startIndex, startIndex + 1, startIndex + 2],
    fps,
  };

  const animations = [...asset.animations];
  const existingIdx = animations.findIndex(a => a.name === animationName);
  
  if (existingIdx >= 0) {
    // Replace if it already exists
    animations[existingIdx] = newAnimation;
  } else {
    animations.push(newAnimation);
  }

  return {
    ...asset,
    frames,
    animations,
  };
}

/**
 * Duplicates the frame at targetIdx and inserts it right after it.
 * Shifts all subsequent animation references + 1.
 */
export function duplicateFrame(asset: SpriteAsset, targetIdx: number): SpriteAsset {
  const newFrames = [...asset.frames];
  const frameToCopy = newFrames[targetIdx].map(row => [...row]);
  newFrames.splice(targetIdx + 1, 0, frameToCopy);

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.flatMap(oldIdx => {
      if (oldIdx === targetIdx) return [oldIdx, targetIdx + 1];
      return oldIdx > targetIdx ? oldIdx + 1 : oldIdx;
    })
  }));

  return { ...asset, frames: newFrames, animations: newAnimations };
}

/**
 * Inserts a fully transparent frame after targetIdx.
 */
export function insertEmptyFrame(asset: SpriteAsset, afterIdx: number): SpriteAsset {
  const size = asset.size;
  const newFrames = [...asset.frames];
  const emptyFrame = Array.from({ length: size }, () => Array(size).fill(0));
  newFrames.splice(afterIdx + 1, 0, emptyFrame);

  const newAnimations = asset.animations.map(anim => ({
    ...anim,
    frameIndices: anim.frameIndices.flatMap(oldIdx => {
      if (oldIdx === afterIdx) return [oldIdx, afterIdx + 1];
      return oldIdx > afterIdx ? oldIdx + 1 : oldIdx;
    })
  }));

  return { ...asset, frames: newFrames, animations: newAnimations };
}

/**
 * Deletes the frame at targetIdx.
 * Important: Base frame (index 0) cannot be deleted if it's the only frame to preserve asset integrity.
 */
export function deleteFrame(asset: SpriteAsset, targetIdx: number): SpriteAsset {
  if (asset.frames.length <= 1) return asset; // Don't delete the last remaining frame

  const newFrames = [...asset.frames];
  newFrames.splice(targetIdx, 1);

  const newAnimations = asset.animations.map(anim => {
    // Remove the deleted frame, shift > targetIdx down by 1
    const validIndices = anim.frameIndices.filter(oldIdx => oldIdx !== targetIdx);
    return {
      ...anim,
      frameIndices: validIndices.map(oldIdx => oldIdx > targetIdx ? oldIdx - 1 : oldIdx)
    };
  });

  return { ...asset, frames: newFrames, animations: newAnimations };
}

/**
 * Moves a frame from one index to another, updating animation definitions
 * to point to their correctly displaced frames.
 */
export function moveFrame(asset: SpriteAsset, fromIdx: number, toIdx: number): SpriteAsset {
  if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= asset.frames.length || toIdx >= asset.frames.length) {
    return asset;
  }

  const newFrames = [...asset.frames];
  const [movedFrame] = newFrames.splice(fromIdx, 1);
  newFrames.splice(toIdx, 0, movedFrame);

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

  return { ...asset, frames: newFrames, animations: newAnimations };
}

