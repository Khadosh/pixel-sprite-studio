import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftArea, squash, stretchBody, findBounds } from '../transforms';
import { analyzeBodySegments } from '../anatomy';

/** 
 * Jump: 4-frame sequence (Anticipation -> Mid-air -> Landing -> Recovery).
 */
export function generateJump(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const bounds = findBounds(base);
  if (!bounds) return Array(4).fill(cloneFrame(base));

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow } = segments;

  // 1. ANTICIPATION (Subtle 1px Squat)
  let f0 = squash(base, [kneeRow], undefined, waistRow); 
  
  // 2. MID-AIR (Stretch + Shift Up)
  let f1 = stretchBody(base, neckRow);
  const wholeBody = { startR: bounds.top, endR: bounds.bottom, startC: 0, endC: size - 1 };
  f1 = shiftArea(f1, wholeBody, -3, 0); 
  
  // 3. LANDING (Subtle 1px Impact)
  let f2 = squash(base, [kneeRow], undefined, waistRow); 
  
  // 4. RECOVERY
  const f3 = cloneFrame(base);

  return [f0, f1, f2, f3];
}
