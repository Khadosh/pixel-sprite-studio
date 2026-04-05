import { PALETTE, ANIMATIONS, FRAME_SIZE } from './pixelCharacter';
import type { SpriteAsset } from './types';

/**
 * Converts the legacy pixelCharacter data into a SpriteAsset.
 * Deduplicates frames and builds animation definitions with frameIndices.
 */
function buildCharacterAsset(): SpriteAsset {
  const uniqueFrames: number[][][] = [];
  const frameMap = new Map<string, number>();

  const getFrameIndex = (frame: number[][]): number => {
    const key = JSON.stringify(frame);
    if (frameMap.has(key)) return frameMap.get(key)!;
    const idx = uniqueFrames.length;
    uniqueFrames.push(frame);
    frameMap.set(key, idx);
    return idx;
  };

  const animations = ANIMATIONS.map(anim => ({
    name: anim.name,
    label: anim.label,
    frameIndices: anim.frames.map(f => getFrameIndex(f)),
    fps: 5,
  }));

  return {
    id: 'pixel-warrior',
    name: 'Pixel Warrior',
    description: 'Classic pixel art warrior with 6 animation states',
    category: 'character',
    size: FRAME_SIZE,
    palette: { ...PALETTE },
    colorNames: {
      1: 'Outline', 2: 'Skin', 3: 'Hair', 4: 'Shirt',
      5: 'Pants', 6: 'Shoes', 7: 'Sword', 8: 'Eyes', 9: 'Hurt',
    },
    frames: uniqueFrames,
    animations,
    tags: ['warrior', 'character', 'rpg'],
  };
}

export const PIXEL_WARRIOR_ASSET = buildCharacterAsset();
