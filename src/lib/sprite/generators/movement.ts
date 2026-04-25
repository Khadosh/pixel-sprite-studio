import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, stretchPixels, leanBody, shiftFrame, clearPixels } from '../transforms';
import { resolveMembers } from '../anatomyResolver';

/** 
 * Jump: 4-frame sequence using Anatomy Engine.
 */
export function generateJump(
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

  // 1. ANTICIPATION (Squat)
  let f0 = clearPixels(cloneFrame(base), movingParts);
  if (torso && head) {
    const upper = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
    f0 = shiftPixels(base, f0, upper, 1, 0);
  }
  if (leg_left) f0 = shiftPixels(base, f0, leg_left.pixels, 0, 0);
  if (leg_right) f0 = shiftPixels(base, f0, leg_right.pixels, 0, 0);

  // 2. MID-AIR (Stretch arms + Rise)
  let f1 = clearPixels(cloneFrame(base), movingParts);
  if (arm_left) f1 = shiftPixels(base, f1, arm_left.pixels, -1, 0);
  if (arm_right) f1 = shiftPixels(base, f1, arm_right.pixels, -1, 0);
  if (torso && head) f1 = shiftPixels(base, f1, [...torso.pixels, ...head.pixels], 0, 0);
  if (leg_left) f1 = shiftPixels(base, f1, leg_left.pixels, 0, 0);
  if (leg_right) f1 = shiftPixels(base, f1, leg_right.pixels, 0, 0);
  f1 = shiftFrame(f1, -4, 0);
  
  // 3. LANDING (Impact)
  let f2 = cloneFrame(f0);
  
  // 4. RECOVERY
  const f3 = cloneFrame(base);

  return [f0, f1, f2, f3];
}

/**
 * Run: Faster walk cycle with torso lean and more aggressive limb movement.
 */
export function generateRun(
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

  const createStep = (isLeftLeading: boolean) => {
    // 1. CONTACT: Lean forward + wide stride
    const leaned = leanBody(base, members.torso?.pivot.r || 16, head?.pivot.r || 8, 2);
    let f1 = clearPixels(leaned, movingParts);
    if (leg_left) f1 = stretchPixels(base, f1, leg_left.pixels, isLeftLeading ? 2 : -2);
    if (leg_right) f1 = stretchPixels(base, f1, leg_right.pixels, isLeftLeading ? -2 : 2);
    if (torso && head) f1 = shiftPixels(base, f1, [...torso.pixels, ...head.pixels], 0, 0);
    if (arm_left) f1 = shiftPixels(base, f1, arm_left.pixels, 0, 0);
    if (arm_right) f1 = shiftPixels(base, f1, arm_right.pixels, 0, 0);
    
    // 2. AIRBORNE: Both feet off ground
    let f2 = shiftFrame(f1, -1, 0);
    
    return [f1, f2];
  };

  // Run is a faster 4-frame loop
  return [...createStep(true), ...createStep(false)];
}
