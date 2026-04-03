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
