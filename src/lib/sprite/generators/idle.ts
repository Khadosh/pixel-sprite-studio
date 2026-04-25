import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, shiftFrame, stretchPixels, clearPixels } from '../transforms';
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
  // 1. Resolve members
  const members = resolveMembers(base, anatomy, orientation);
  const head = members.head;
  const torso = members.torso;
  const arms = [members.arm_left, members.arm_right].filter(Boolean);

  // Unified list of all upper-body parts that move during breathing
  const upperBodyPixels = [
    ...(head?.pixels || []),
    ...arms.flatMap(a => a.pixels || [])
  ];
  
  const torsoPixels = torso?.pixels || [];
  
  // Total set of pixels that will be cleared from the static shell
  const allMovingPixels = [
    ...torsoPixels,
    ...upperBodyPixels
  ];

  // 1. Neutral (Base)
  const f0 = cloneFrame(base);

  // 2. Inhale (Upper body rises)
  let f1 = cloneFrame(base);
  if (allMovingPixels.length > 0) {
    f1 = clearPixels(f1, allMovingPixels);
    // Draw all parts shifted UP (Atomic move)
    f1 = shiftPixels(base, f1, allMovingPixels, -1, 0); 
    // Re-draw torso with STRETCH to close the waist gap
    f1 = stretchPixels(base, f1, torsoPixels, -1);
  } else {
    f1 = shiftFrame(base, -1, 0);
  }

  // 3. Exhale (Settle / Slight sink)
  let f2 = cloneFrame(base);
  if (allMovingPixels.length > 0) {
    f2 = clearPixels(f2, allMovingPixels);
    f2 = shiftPixels(base, f2, allMovingPixels, 1, 0);
  } else {
    f2 = shiftFrame(base, 1, 0);
  }

  // Sequence: Neutral -> Inhale -> Neutral -> Exhale
  return [f0, f1, f0, f2];
}
