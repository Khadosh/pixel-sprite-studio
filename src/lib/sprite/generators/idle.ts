import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, shiftFrame } from '../transforms';
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
    // Rise torso + head + arms
    const upperBodyPixels = [
      ...(torso.pixels || []),
      ...(head?.pixels || []),
      ...arms.flatMap(a => a.pixels || [])
    ];
    f1 = shiftPixels(base, upperBodyPixels, -1, 0);
  } else {
    // Fallback if no members resolved
    f1 = shiftFrame(base, -1, 0);
  }

  // 3. Exhale (Settle / Slight squash)
  let f2 = cloneFrame(base);
  if (torso) {
    // Head and torso sink slightly, legs stay
    const sinkingPixels = [
      ...(torso.pixels || []),
      ...(head?.pixels || [])
    ];
    f2 = shiftPixels(base, sinkingPixels, 1, 0);
  } else {
    f2 = shiftFrame(base, 1, 0);
  }

  // Sequence: Neutral -> Inhale -> Neutral -> Exhale
  return [f0, f1, f0, f2];
}
