import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, squash, findBounds, stretchBody } from '../transforms';
import { analyzeBodySegments } from '../anatomy';

/** 
 * Idle: Breathing cycle with chest expansion and subtle knee flexion.
 */
export function generateIdle(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow } = segments;

  // 1. Neutral (Base)
  const f0 = cloneFrame(base);

  // 2. Inhale (Chest expands / Upper body rises)
  const f1 = stretchBody(base, waistRow);

  // 3. Exhale (Settle / Knee flex)
  const f2 = squash(base, [kneeRow]);

  // Sequence: Neutral -> Inhale -> Neutral -> Exhale
  // This creates a smoother "breathing" loop than a linear 1-2-3-4
  return [f0, f1, f0, f2];
}
