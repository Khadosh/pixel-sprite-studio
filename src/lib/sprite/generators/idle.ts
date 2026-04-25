import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, shiftFrame, stretchPixels } from '../transforms';
import { resolveMembers } from '../anatomyResolver';

/** 
 * Idle: Breathing cycle with chest expansion and subtle hierarchy.
 * Now uses the anatomy engine to ensure body parts move correctly.
 */
export function generateIdle(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const head = members.head;
  const torso = members.torso;
  const arms = [members.arm_left, members.arm_right].filter(Boolean);

  // 1. Neutral (Base)
  const f0 = cloneFrame(base);

  // 2. Inhale (Upper body rises)
  let f1 = cloneFrame(base);
  if (torso) {
    // 1. Move head and arms normally (no stretch to avoid smearing the top)
    const upperExtras = [
      ...(head?.pixels || []),
      ...arms.flatMap(a => a.pixels || [])
    ];
    f1 = shiftPixels(f1, upperExtras, -1, 0);
    
    // 2. Stretch ONLY the torso downwards to maintain leg connection
    f1 = stretchPixels(base, f1, torso.pixels, -1);
  } else {
    f1 = shiftFrame(base, -1, 0);
  }

  // 3. Exhale (Settle / Slight sink)
  let f2 = cloneFrame(base);
  if (torso) {
    // When sinking, we don't want to stretch upwards! 
    // We just shift the entire upper body down.
    const sinkingPixels = [
      ...(torso.pixels || []),
      ...(head?.pixels || []),
      ...arms.flatMap(a => a.pixels || [])
    ];
    f2 = shiftPixels(f2, sinkingPixels, 1, 0);
  } else {
    f2 = shiftFrame(base, 1, 0);
  }

  // Sequence: Neutral -> Inhale -> Neutral -> Exhale
  return [f0, f1, f0, f2];
}
