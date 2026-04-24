import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftArea, leanBody, stretchBody, squash, findBounds, getCenterOfMass } from '../transforms';
import { analyzeBodySegments } from '../anatomy';

/** 
 * Front Walk: Dynamic 8-frame cycle with knee flexion and stable torso.
 */
export function generateWalk(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return Array(8).fill(cloneFrame(base));

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow, leftArmArea, rightArmArea, leftLegArea, rightLegArea } = segments;
  
  const createStep = (isLeftLeading: boolean) => {
    // 1. CONTACT: Both feet down, split distance.
    let fContact = cloneFrame(base);
    if (leftArmArea) fContact = shiftArea(fContact, leftArmArea, isLeftLeading ? 1 : -1, 0);
    if (rightArmArea) fContact = shiftArea(fContact, rightArmArea, isLeftLeading ? -1 : 1, 0);
    
    // 2. DOWN: Subtle 1px squash for weight
    let fDown = squash(base, [waistRow], undefined, neckRow);
    const headArea = { startR: bounds.top, endR: neckRow, startC: 0, endC: size - 1 };
    fDown = shiftArea(fDown, headArea, 1, 0);
    
    // 3. PASSING: Lift one leg
    let fPass = cloneFrame(base);
    const passingLeg = isLeftLeading ? rightLegArea : leftLegArea;
    fPass = shiftArea(fPass, passingLeg, -1, 0); 
    
    // 4. UP: High point
    let fUp = stretchBody(base, neckRow);
    
    return [fContact, fDown, fPass, fUp];
  };

  return [...createStep(true), ...createStep(false)];
}

/** 
 * Side Walk: Horizontal scissors pattern with knee lift and flexion.
 */
export function generateWalkSide(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return Array(8).fill(cloneFrame(base));

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow, leftLegArea, rightLegArea } = segments;
  
  const createStep = (isLeftForward: boolean) => {
    const forwardLeg = isLeftForward ? leftLegArea : rightLegArea;
    const backLeg = isLeftForward ? rightLegArea : leftLegArea;
    
    // 1. CONTACT: Both feet on floor
    let fContact = shiftArea(base, forwardLeg, 0, 1);
    fContact = shiftArea(fContact, backLeg, 0, -1);
    
    // 2. DOWN: Subtle 1px squash at knee
    let fDown = squash(fContact, [kneeRow], undefined, waistRow);
    
    // 3. PASS POS: Legs together, passing leg lifts
    let fPass = cloneFrame(base);
    fPass = shiftArea(fPass, backLeg, -1, 0); 
    
    // 4. UP: Push off
    let fUp = stretchBody(base, neckRow);
    fUp = shiftArea(fUp, backLeg, -1, 1); 

    return [fContact, fDown, fPass, fUp];
  };

  return [...createStep(true), ...createStep(false)];
}

/** 
 * Top-Down Walk: Vertical bobbing and limb shifting.
 */
export function generateWalkTopDown(
  base: Frame, 
  anatomy?: AnatomyConfig
): Frame[] {
  const size = base.length;
  const bounds = findBounds(base);
  const com = getCenterOfMass(base);
  if (!bounds || !com) return Array(4).fill(cloneFrame(base));

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, ankleRow, leftArmArea, rightArmArea } = segments;
  const centerCol = Math.floor(com.c);
  
  const leftLegArea = { startR: ankleRow, endR: bounds.bottom, startC: bounds.left, endC: centerCol };
  const rightLegArea = { startR: ankleRow, endR: bounds.bottom, startC: centerCol + 1, endC: bounds.right };

  // Frame 0: Left foot lifts (shifts UP), Right arm forward (shifts DOWN)
  let f0 = shiftArea(base, leftLegArea, -1, 0); 
  if (rightArmArea) f0 = shiftArea(f0, rightArmArea, 1, 0); 
  if (leftArmArea) f0 = shiftArea(f0, leftArmArea, -1, 0); 

  // Frame 1: Mid height bob down
  const headArea = { startR: bounds.top, endR: neckRow, startC: 0, endC: size - 1 };
  let f1 = shiftArea(base, headArea, 1, 0);

  // Frame 2: Right foot lifts (shifts UP), Left arm forward (shifts DOWN)
  let f2 = shiftArea(base, rightLegArea, -1, 0); 
  if (leftArmArea) f2 = shiftArea(f2, leftArmArea, 1, 0);
  if (rightArmArea) f2 = shiftArea(f2, rightArmArea, -1, 0);

  // Frame 3: Mid height stretch up
  const f3 = stretchBody(base, neckRow);

  return [f0, f1, f2, f3];
}
