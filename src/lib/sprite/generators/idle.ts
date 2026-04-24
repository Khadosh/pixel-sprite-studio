import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftArea, squash, findBounds } from '../transforms';
import { analyzeBodySegments } from '../anatomy';

/** 
 * Idle: Breathing cycle with subtle knee flexion.
 */
export function generateIdle(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const bounds = findBounds(base);
  if (!bounds) return Array(4).fill(cloneFrame(base));

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow } = segments;

  const headArea = { startR: bounds.top, endR: neckRow, startC: 0, endC: size - 1 };
  const midDrop = Math.floor(neckRow + (waistRow - neckRow) / 2);
  const upperBodyArea = { startR: 0, endR: midDrop, startC: 0, endC: size - 1 };

  // 1. Neutral (Base)
  const f0 = cloneFrame(base);

  // 2. Breath In (Rising)
  let f1 = cloneFrame(base);
  f1 = shiftArea(f1, headArea, -1, 0); 

  // 3. Breath Out (Subtle 1px drop)
  let f2 = squash(base, [kneeRow], undefined, waistRow); // Just 1px flex
  f2 = shiftArea(f2, headArea, 1, 0); // slight head drop

  // 4. Return to Neutral
  const f3 = cloneFrame(base);

  return [f0, f1, f2, f3];
}
