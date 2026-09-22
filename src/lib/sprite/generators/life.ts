import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, rotatePixels, shiftFrame, squash, clearPixels } from '../transforms';
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
  const { head, torso, arm_left, arm_right, leg_left, leg_right } = members;
  const movingParts = [
    ...(torso?.pixels || []),
    ...(head?.pixels || []),
    ...(arm_left?.pixels || []),
    ...(arm_right?.pixels || []),
    ...(leg_left?.pixels || []),
    ...(leg_right?.pixels || [])
  ];

  // 1. IMPACT: Push back and slight rise
  let f1 = clearPixels(shiftFrame(base, -1, -2), movingParts);
  if (head) f1 = rotatePixels(base, f1, head.pixels, head.pivot, -15);
  if (torso) f1 = shiftPixels(base, f1, torso.pixels, 0, 0);
  if (leg_left) f1 = shiftPixels(base, f1, leg_left.pixels, 0, 0);
  if (leg_right) f1 = shiftPixels(base, f1, leg_right.pixels, 0, 0);
  
  // 2. RECOVERY: Settle down
  const f2 = shiftFrame(base, 1, -1);
  
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
  const movingParts = [
    ...(torso?.pixels || []),
    ...(head?.pixels || []),
    ...(arm_left?.pixels || []),
    ...(arm_right?.pixels || []),
    ...(leg_left?.pixels || []),
    ...(leg_right?.pixels || [])
  ];

  // 1. KNEEL: Lower torso and head significantly
  let f1 = clearPixels(cloneFrame(base), movingParts);
  if (torso && head) {
    const upper = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
    f1 = shiftPixels(base, f1, upper, 4, 0);
  }
  if (leg_left) f1 = shiftPixels(base, f1, leg_left.pixels, 0, 0);
  if (leg_right) f1 = shiftPixels(base, f1, leg_right.pixels, 0, 0);

  // 2. COLLAPSE: Forward tilt + lower
  let f2 = clearPixels(cloneFrame(base), movingParts);
  if (head) f2 = rotatePixels(base, f2, head.pixels, head.pivot, 45);
  if (torso) f2 = shiftPixels(base, f2, torso.pixels, 4, 2);
  if (leg_left) f2 = shiftPixels(base, f2, leg_left.pixels, 4, 2);
  if (leg_right) f2 = shiftPixels(base, f2, leg_right.pixels, 4, 2);

  // 3. FLAT: Extreme squash / Grounded
  const f3 = squash(f2, [Math.floor(base.length * 0.8), Math.floor(base.length * 0.9)]);
  
  return [f1, f2, f3];
}
