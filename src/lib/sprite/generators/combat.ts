import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftArea, squash, leanBody, findBounds, shiftFrame, rotateArea } from '../transforms';
import { analyzeBodySegments } from '../anatomy';
import { addGlow } from '../drawing';

/** 
 * Attack: Forward lunge with knee flexion and swinging arm.
 */
export function generateAttack(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow, leftArmArea, rightArmArea, rightLegArea, pivots } = segments;
  
  // 1. Wind up (Lean back + Lift arm)
  let f0 = leanBody(base, waistRow, neckRow, -1);
  if (rightArmArea) {
    f0 = rotateArea(f0, rightArmArea, pivots.rightShoulder, -30); // Cock back arm
  }
  
  // 2. Strike (Lunge forward + Swing arm down)
  let f1 = shiftArea(base, rightLegArea, -1, 2); // Lunge leg
  f1 = leanBody(f1, waistRow, neckRow, 2); 
  if (rightArmArea) {
    f1 = rotateArea(f1, rightArmArea, pivots.rightShoulder, 60); // Swing down
  }
  
  // 3. Follow through
  let f2 = leanBody(base, waistRow, neckRow, 1);
  if (rightArmArea) {
    f2 = rotateArea(f2, rightArmArea, pivots.rightShoulder, 90); // Full extension
  }
  
  return [f0, f1, f2, f2];
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
