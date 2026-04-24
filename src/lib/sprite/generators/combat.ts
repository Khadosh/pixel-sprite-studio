import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftArea, squash, leanBody, findBounds, shiftFrame } from '../transforms';
import { analyzeBodySegments } from '../anatomy';
import { addGlow } from '../drawing';

/** 
 * Attack: Forward lunge with knee flexion on the leading leg.
 */
export function generateAttack(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow, leftArmArea, rightArmArea, rightLegArea } = segments;
  
  // 1. Wind up (Lean back)
  let f0 = leanBody(base, waistRow, neckRow, -1);
  
  // 2. Strike (Lunge forward + Knee Bend)
  let f1 = shiftArea(base, rightLegArea, -1, 2); // Leading leg lunges and bends
  f1 = leanBody(f1, waistRow, neckRow, 2); // Lean into strike
  if (rightArmArea) f1 = shiftArea(f1, rightArmArea, -1, 3); // Arm extends forward
  
  // 3. Recovery
  const f2 = cloneFrame(base);
  
  return [f0, f1, f2, f2];
}

/** 
 * Hurt: Knockback with knee buckle.
 */
export function generateHurt(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow } = segments;

  // 1. Impact (Flash/Lean back + Knee buckle)
  let f0 = leanBody(base, waistRow, neckRow, -3);
  f0 = squash(f0, [kneeRow], undefined, waistRow); // Knees buckle from impact
  
  // 2. Recovery
  const f1 = cloneFrame(base);

  return [f0, f1, f0, f1];
}

/** 
 * Cast: Raising arms with steady base and magical glow.
 */
export function generateCast(
  base: Frame, 
  glowColor: number,
  anatomy?: AnatomyConfig
): Frame[] {
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow, leftArmArea, rightArmArea } = segments;

  // 1. Raising arms
  let f0 = cloneFrame(base);
  if (leftArmArea) f0 = shiftArea(f0, leftArmArea, -2, 0);
  if (rightArmArea) f0 = shiftArea(f0, rightArmArea, -2, 0);
  
  // 2. Peak Power (Vibrate + Glow + Knee Flex)
  let f1 = shiftArea(f0, { startR: 0, endR: neckRow, startC: 0, endC: base.length - 1 }, -1, 0);
  f1 = squash(f1, [kneeRow], undefined, waistRow); // Flex knees at peak
  f1 = addGlow(f1, glowColor);

  return [f0, f1, f0, f1];
}

/** 
 * Top-Down Attack: Vertical lunge instead of horizontal.
 */
export function generateAttackTopDown(
  base: Frame, 
  anatomy?: AnatomyConfig,
  isUpDir: boolean = false
): Frame[] {
  const segments = analyzeBodySegments(base, anatomy);
  const { rightArmArea, leftArmArea } = segments;
  const dir = isUpDir ? -1 : 1; 

  // Frame 1: Anticipation (recoil)
  let f1 = shiftFrame(base, -dir, 0);
  
  // Frame 2: Lunge forward
  let f2 = shiftFrame(base, dir, 0);
  
  const mainArm = rightArmArea || leftArmArea;
  if (mainArm) {
    f2 = shiftArea(f2, mainArm, dir, 0);
  }
  
  return [f1, f2];
}
