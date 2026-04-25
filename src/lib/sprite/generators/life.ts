import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, rotatePixels, shiftFrame, squash } from '../transforms';
import { resolveMembers } from '../anatomyResolver';

/**
 * Hurt: Physical recoil with head tilt and torso push-back.
 */
export function generateHurt(
  base: Frame,
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const { head, torso } = members;

  // 1. IMPACT: Push back and slight rise
  let f1 = shiftFrame(base, -1, -2);
  if (head) f1 = rotatePixels(f1, head.pixels, head.pivot, -15);
  
  // 2. RECOVERY: Settle down
  let f2 = shiftFrame(base, 1, -1);
  
  return [base, f1, f2, base];
}

/**
 * Die: Physical collapse sequence (kneel -> faceplant -> settle).
 */
export function generateDie(
  base: Frame,
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const { head, torso, arm_left, arm_right, leg_left, leg_right } = members;

  // 1. KNEEL: Lower torso and head significantly
  let f1 = cloneFrame(base);
  if (torso && head) {
    const upper = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
    f1 = shiftPixels(f1, upper, 4, 0);
  }

  // 2. COLLAPSE: Forward tilt + lower
  let f2 = cloneFrame(f1);
  if (head) f2 = rotatePixels(f2, head.pixels, head.pivot, 45);
  f2 = shiftFrame(f2, 4, 2);

  // 3. FLAT: Extreme squash / Grounded
  let f3 = squash(f2, [Math.floor(base.length * 0.8), Math.floor(base.length * 0.9)]);
  
  return [f1, f2, f3];
}
