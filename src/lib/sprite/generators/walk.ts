import type { Frame, AnatomyConfig } from '../../types';
import { cloneFrame, shiftPixels, stretchPixels, findBounds, getCenterOfMass, shiftFrame } from '../transforms';
import { resolveMembers } from '../anatomyResolver';

/** 
 * Front Walk: Dynamic 8-frame cycle using Anatomy Engine.
 */
export function generateWalk(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const { head, torso, arm_left, arm_right, leg_left, leg_right } = members;
  
  const createStep = (isLeftLeading: boolean) => {
    // 1. CONTACT: Both feet down, split distance.
    let fContact = cloneFrame(base);
    if (arm_left) fContact = stretchPixels(base, fContact, arm_left.pixels, isLeftLeading ? 1 : -1);
    if (arm_right) fContact = stretchPixels(base, fContact, arm_right.pixels, isLeftLeading ? -1 : 1);
    
    // 2. DOWN: Weight impact (torso sinks 1px)
    let fDown = cloneFrame(base);
    if (torso && head) {
      const upperBody = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
      fDown = shiftPixels(fDown, upperBody, 1, 0);
    } else {
      fDown = shiftFrame(base, 1, 0);
    }
    
    // 3. PASSING: Lift passing leg 1px
    let fPass = cloneFrame(base);
    const passingLeg = isLeftLeading ? leg_right : leg_left;
    if (passingLeg) {
      fPass = shiftPixels(fPass, passingLeg.pixels, -1, 0);
    }
    
    // 4. UP: High point (Upper body rises 1px)
    let fUp = cloneFrame(base);
    if (torso && head) {
      const upperBody = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
      fUp = shiftPixels(fUp, upperBody, -1, 0);
    } else {
      fUp = shiftFrame(base, -1, 0);
    }
    
    return [fContact, fDown, fPass, fUp];
  };

  return [...createStep(true), ...createStep(false)];
}

/** 
 * Side Walk: Horizontal scissors pattern using Anatomy Engine.
 */
export function generateWalkSide(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 1
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const { head, torso, arm_left, arm_right, leg_left, leg_right } = members;
  
  const createStep = (isLeftForward: boolean) => {
    const forwardLeg = isLeftForward ? leg_left : leg_right;
    const backLeg = isLeftForward ? leg_right : leg_left;
    
    // 1. CONTACT: Both feet on floor (X-offset)
    let fContact = cloneFrame(base);
    if (forwardLeg) fContact = shiftPixels(fContact, forwardLeg.pixels, 0, 1);
    if (backLeg) fContact = shiftPixels(fContact, backLeg.pixels, 0, -1);
    
    // 2. DOWN: Weight impact
    let fDown = cloneFrame(fContact);
    if (torso && head) {
      const upperBody = [...torso.pixels, ...head.pixels];
      fDown = shiftPixels(fDown, upperBody, 1, 0);
    }
    
    // 3. PASS POS: Legs together, passing leg lifts
    let fPass = cloneFrame(base);
    if (backLeg) fPass = shiftPixels(fPass, backLeg.pixels, -1, 0); 
    
    // 4. UP: Push off
    let fUp = cloneFrame(base);
    if (torso && head) fUp = shiftPixels(fUp, [...torso.pixels, ...head.pixels], -1, 0);
    if (backLeg) fUp = shiftPixels(fUp, backLeg.pixels, -1, 1); 

    return [fContact, fDown, fPass, fUp];
  };

  return [...createStep(true), ...createStep(false)];
}

/** 
 * Top-Down Walk: Vertical bobbing and limb shifting.
 */
export function generateWalkTopDown(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const { head, torso, arm_left, arm_right, leg_left, leg_right } = members;

  const createStep = (isLeftLeading: boolean) => {
    const leadArm = isLeftLeading ? arm_right : arm_left;
    const backArm = isLeftLeading ? arm_left : arm_right;
    const leadLeg = isLeftLeading ? leg_left : leg_right;
    const backLeg = isLeftLeading ? leg_right : leg_left;

    // 1. CONTACT: High stride. 2px offset.
    let f1 = cloneFrame(base);
    if (leadLeg) f1 = stretchPixels(base, f1, leadLeg.pixels, 2); 
    if (backLeg) f1 = stretchPixels(base, f1, backLeg.pixels, -1);
    if (leadArm) f1 = stretchPixels(base, f1, leadArm.pixels, 1); 
    if (backArm) f1 = stretchPixels(base, f1, backArm.pixels, -1);
    
    // 2. DOWN: Weight impact.
    let f2 = cloneFrame(f1);
    if (torso && head) f2 = shiftPixels(f2, [...torso.pixels, ...head.pixels], 1, 0);
    
    // 3. PASSING: Lifting one leg.
    let f3 = cloneFrame(base);
    if (backLeg) f3 = stretchPixels(base, f3, backLeg.pixels, -2); 
    
    // 4. UP: High point.
    let f4 = cloneFrame(base);
    if (torso && head) f4 = shiftPixels(f4, [...torso.pixels, ...head.pixels], -1, 0);
    
    return [f1, f2, f3, f4];
  };

  return [...createStep(true), ...createStep(false)];
}
