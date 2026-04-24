import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftArea, leanBody, stretchBody, squash, findBounds, getCenterOfMass, stretchArea } from '../transforms';
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
    if (leftArmArea) fContact = stretchArea(base, fContact, leftArmArea, isLeftLeading ? 1 : -1, 'top');
    if (rightArmArea) fContact = stretchArea(base, fContact, rightArmArea, isLeftLeading ? -1 : 1, 'top');
    
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
  if (!bounds) return Array(8).fill(cloneFrame(base));

  const segments = analyzeBodySegments(base, anatomy);
  const { neckRow, waistRow, kneeRow, torsoCenterCol } = segments;
  
  // ARMS: More aggressive fallback if not detected
  const lArm = segments.leftArmArea || { 
    startR: neckRow, 
    endR: waistRow, 
    startC: bounds.left, 
    endC: Math.max(bounds.left, torsoCenterCol - 3) 
  };
  const rArm = segments.rightArmArea || { 
    startR: neckRow, 
    endR: waistRow, 
    startC: Math.min(bounds.right, torsoCenterCol + 3), 
    endC: bounds.right 
  };

  const createStep = (isLeftLeading: boolean) => {
    const leadArm = isLeftLeading ? rArm : lArm;
    const backArm = isLeftLeading ? lArm : rArm;
    const leadLeg = isLeftLeading ? segments.leftLegArea : segments.rightLegArea;
    const backLeg = isLeftLeading ? segments.rightLegArea : segments.leftLegArea;

    // 1. CONTACT: High stride. 2px offset.
    let f1 = cloneFrame(base);
    f1 = stretchArea(base, f1, leadLeg, 2, 'top'); 
    f1 = stretchArea(base, f1, backLeg, -1, 'top');
    f1 = stretchArea(base, f1, leadArm, 1, 'top'); 
    f1 = stretchArea(base, f1, backArm, -1, 'top');
    
    // 2. DOWN: Weight impact. Squash.
    let f2 = squash(f1, [kneeRow]);
    
    // 3. PASSING: Lifting one leg.
    let f3 = cloneFrame(base);
    f3 = stretchArea(base, f3, backLeg, -2, 'top'); 
    
    // 4. UP: High point. Stretch torso.
    let f4 = stretchBody(base, neckRow);
    
    return [f1, f2, f3, f4];
  };

  return [...createStep(true), ...createStep(false)];
}
