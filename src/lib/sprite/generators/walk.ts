import { cloneFrame, shiftPixels, stretchPixels, findBounds, getCenterOfMass, shiftFrame, clearPixels } from '../transforms';
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
    const movingParts = [
      ...(torso?.pixels || []),
      ...(head?.pixels || []),
      ...(arm_left?.pixels || []),
      ...(arm_right?.pixels || []),
      ...(leg_left?.pixels || []),
      ...(leg_right?.pixels || [])
    ];

    // 1. CONTACT: Both feet down, split distance.
    let fContact = clearPixels(cloneFrame(base), movingParts);
    if (arm_left) fContact = stretchPixels(base, fContact, arm_left.pixels, isLeftLeading ? 1 : -1);
    if (arm_right) fContact = stretchPixels(base, fContact, arm_right.pixels, isLeftLeading ? -1 : 1);
    // Draw legs in contact
    if (leg_left) fContact = shiftPixels(base, fContact, leg_left.pixels, 0, 0);
    if (leg_right) fContact = shiftPixels(base, fContact, leg_right.pixels, 0, 0);
    // Draw body
    if (torso && head) fContact = shiftPixels(base, fContact, [...torso.pixels, ...head.pixels], 0, 0);
    
    // 2. DOWN: Weight impact (torso sinks 1px)
    let fDown = clearPixels(cloneFrame(base), movingParts);
    if (torso && head) {
      const upperBody = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
      fDown = shiftPixels(base, fDown, upperBody, 1, 0);
    }
    if (leg_left) fDown = shiftPixels(base, fDown, leg_left.pixels, 0, 0);
    if (leg_right) fDown = shiftPixels(base, fDown, leg_right.pixels, 0, 0);
    
    // 3. PASSING: Lift passing leg 1px
    let fPass = clearPixels(cloneFrame(base), movingParts);
    const passingLeg = isLeftLeading ? leg_right : leg_left;
    const standingLeg = isLeftLeading ? leg_left : leg_right;
    if (passingLeg) fPass = shiftPixels(base, fPass, passingLeg.pixels, -1, 0);
    if (standingLeg) fPass = shiftPixels(base, fPass, standingLeg.pixels, 0, 0);
    if (torso && head) fPass = shiftPixels(base, fPass, [...torso.pixels, ...head.pixels], 0, 0);
    
    // 4. UP: High point (Upper body rises 1px)
    let fUp = clearPixels(cloneFrame(base), movingParts);
    if (torso && head) {
      const upperBody = [...torso.pixels, ...head.pixels, ...(arm_left?.pixels || []), ...(arm_right?.pixels || [])];
      fUp = shiftPixels(base, fUp, upperBody, -1, 0);
    }
    if (leg_left) fUp = shiftPixels(base, fUp, leg_left.pixels, 0, 0);
    if (leg_right) fUp = shiftPixels(base, fUp, leg_right.pixels, 0, 0);
    
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
    const movingParts = [
      ...(torso?.pixels || []),
      ...(head?.pixels || []),
      ...(forwardLeg?.pixels || []),
      ...(backLeg?.pixels || [])
    ];
    
    // 1. CONTACT: Both feet on floor (X-offset)
    let fContact = clearPixels(cloneFrame(base), movingParts);
    if (forwardLeg) fContact = shiftPixels(base, fContact, forwardLeg.pixels, 0, 1);
    if (backLeg) fContact = shiftPixels(base, fContact, backLeg.pixels, 0, -1);
    if (torso && head) fContact = shiftPixels(base, fContact, [...torso.pixels, ...head.pixels], 0, 0);
    
    // 2. DOWN: Weight impact
    let fDown = clearPixels(cloneFrame(base), movingParts);
    if (torso && head) {
      const upperBody = [...torso.pixels, ...head.pixels];
      fDown = shiftPixels(base, fDown, upperBody, 1, 0);
    }
    if (forwardLeg) fDown = shiftPixels(base, fDown, forwardLeg.pixels, 0, 1);
    if (backLeg) fDown = shiftPixels(base, fDown, backLeg.pixels, 0, -1);
    
    // 3. PASS POS: Legs together, passing leg lifts
    let fPass = clearPixels(cloneFrame(base), movingParts);
    if (backLeg) fPass = shiftPixels(base, fPass, backLeg.pixels, -1, 0); 
    if (forwardLeg) fPass = shiftPixels(base, fPass, forwardLeg.pixels, 0, 0);
    if (torso && head) fPass = shiftPixels(base, fPass, [...torso.pixels, ...head.pixels], 0, 0);
    
    // 4. UP: Push off
    let fUp = clearPixels(cloneFrame(base), movingParts);
    if (torso && head) fUp = shiftPixels(base, fUp, [...torso.pixels, ...head.pixels], -1, 0);
    if (backLeg) fUp = shiftPixels(base, fUp, backLeg.pixels, -1, 1); 
    if (forwardLeg) fUp = shiftPixels(base, fUp, forwardLeg.pixels, 0, 0);

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
    const movingParts = [
      ...(torso?.pixels || []),
      ...(head?.pixels || []),
      ...(arm_left?.pixels || []),
      ...(arm_right?.pixels || []),
      ...(leg_left?.pixels || []),
      ...(leg_right?.pixels || [])
    ];

    // 1. CONTACT: High stride. 2px offset.
    let f1 = clearPixels(cloneFrame(base), movingParts);
    if (leadLeg) f1 = stretchPixels(base, f1, leadLeg.pixels, 2); 
    if (backLeg) f1 = stretchPixels(base, f1, backLeg.pixels, -1);
    if (leadArm) f1 = stretchPixels(base, f1, leadArm.pixels, 1); 
    if (backArm) f1 = stretchPixels(base, f1, backArm.pixels, -1);
    if (torso && head) f1 = shiftPixels(base, f1, [...torso.pixels, ...head.pixels], 0, 0);
    
    // 2. DOWN: Weight impact.
    let f2 = clearPixels(cloneFrame(f1), movingParts);
    if (torso && head) f2 = shiftPixels(base, f2, [...torso.pixels, ...head.pixels], 1, 0);
    
    // 3. PASSING: Lifting one leg.
    let f3 = clearPixels(cloneFrame(base), movingParts);
    if (backLeg) f3 = stretchPixels(base, f3, backLeg.pixels, -2); 
    if (leadLeg) f3 = shiftPixels(base, f3, leadLeg.pixels, 0, 0);
    if (torso && head) f3 = shiftPixels(base, f3, [...torso.pixels, ...head.pixels], 0, 0);
    
    // 4. UP: High point.
    let f4 = clearPixels(cloneFrame(base), movingParts);
    if (torso && head) f4 = shiftPixels(base, f4, [...torso.pixels, ...head.pixels], -1, 0);
    if (leg_left) f4 = shiftPixels(base, f4, leg_left.pixels, 0, 0);
    if (leg_right) f4 = shiftPixels(base, f4, leg_right.pixels, 0, 0);
    
    return [f1, f2, f3, f4];
  };

  return [...createStep(true), ...createStep(false)];
}
