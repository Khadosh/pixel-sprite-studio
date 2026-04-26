import type { Frame, AnatomyConfig } from '../../types';
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
    const upperBodyPixels = [
      ...(head?.pixels || []),
      ...(torso?.pixels || []),
      ...(arm_left?.pixels || []),
      ...(arm_right?.pixels || [])
    ];
    
    const movingParts = [
      ...upperBodyPixels,
      ...(leg_left?.pixels || []),
      ...(leg_right?.pixels || [])
    ];

    const torsoPixels = torso?.pixels || [];
    const passingLeg = isLeftLeading ? leg_right : leg_left;
    const standingLeg = isLeftLeading ? leg_left : leg_right;

    // 1. CONTACT: Lead leg forward, OPPOSITE arm forward
    let fContact = clearPixels(cloneFrame(base), movingParts);
    fContact = shiftPixels(base, fContact, [ ...(head?.pixels || []), ...(torso?.pixels || []) ], 0, 0);
    // Cross-lateral coordination: isLeftLeading means Left Leg is forward -> Right Arm swings DOWN
    if (arm_left) fContact = stretchPixels(base, fContact, arm_left.pixels, isLeftLeading ? -1 : 1);
    if (arm_right) fContact = stretchPixels(base, fContact, arm_right.pixels, isLeftLeading ? 1 : -1);
    if (leg_left) fContact = shiftPixels(base, fContact, leg_left.pixels, 0, isLeftLeading ? -1 : 0);
    if (leg_right) fContact = shiftPixels(base, fContact, leg_right.pixels, 0, isLeftLeading ? 0 : 1);
    
    // 2. DOWN: Weight impact (Slight sink)
    let fDown = clearPixels(cloneFrame(base), movingParts);
    fDown = shiftPixels(base, fDown, upperBodyPixels, 1, 0);
    if (leg_left) fDown = shiftPixels(base, fDown, leg_left.pixels, 0, isLeftLeading ? -1 : 0);
    if (leg_right) fDown = shiftPixels(base, fDown, leg_right.pixels, 0, isLeftLeading ? 0 : 1);
    
    // 3. PASSING: Lifting leg crosses the midline
    let fPass = clearPixels(cloneFrame(base), movingParts);
    fPass = shiftPixels(base, fPass, upperBodyPixels, 0, 0);
    if (standingLeg) fPass = shiftPixels(base, fPass, standingLeg.pixels, 0, 0);
    if (passingLeg) fPass = shiftPixels(base, fPass, passingLeg.pixels, -1, 0);
    
    // 4. UP: Push off (High point)
    let fUp = clearPixels(cloneFrame(base), movingParts);
    fUp = shiftPixels(base, fUp, upperBodyPixels, -1, 0);
    fUp = stretchPixels(base, fUp, torsoPixels, -1);
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
    
    const upperBodyPixels = [
      ...(head?.pixels || []),
      ...(torso?.pixels || []),
      ...(arm_left?.pixels || []),
      ...(arm_right?.pixels || [])
    ];
    
    const movingParts = [
      ...upperBodyPixels,
      ...(leg_left?.pixels || []),
      ...(leg_right?.pixels || [])
    ];
    
    // 1. CONTACT: Widest stride, both feet on ground. Height: Neutral
    let fContact = clearPixels(cloneFrame(base), movingParts);
    fContact = shiftPixels(base, fContact, upperBodyPixels, 0, 0);
    if (forwardLeg) fContact = shiftPixels(base, fContact, forwardLeg.pixels, 0, 2);
    if (backLeg) fContact = shiftPixels(base, fContact, backLeg.pixels, 0, -2);
    
    // 2. DOWN: Lowest point, feet closer. Height: -1 (Sink)
    let fDown = clearPixels(cloneFrame(base), movingParts);
    fDown = shiftPixels(base, fDown, upperBodyPixels, 1, 0); // Sink
    if (forwardLeg) fDown = shiftPixels(base, fDown, forwardLeg.pixels, 0, 1);
    if (backLeg) fDown = shiftPixels(base, fDown, backLeg.pixels, 0, -1);
    
    // 3. PASS POS: Legs crossing, passing leg lifts. Height: Neutral
    let fPass = clearPixels(cloneFrame(base), movingParts);
    fPass = shiftPixels(base, fPass, upperBodyPixels, 0, 0);
    if (forwardLeg) fPass = shiftPixels(base, fPass, forwardLeg.pixels, 0, 0); // Static support
    if (backLeg) fPass = shiftPixels(base, fPass, backLeg.pixels, -2, 0); // High lift
    
    // 4. UP: Highest point, push off. Height: +1 (Rise)
    let fUp = clearPixels(cloneFrame(base), movingParts);
    fUp = shiftPixels(base, fUp, upperBodyPixels, -1, 0); // Rise
    fUp = stretchPixels(base, fUp, torso?.pixels || [], -1); // Stretch torso
    if (forwardLeg) fUp = shiftPixels(base, fUp, forwardLeg.pixels, 0, 0);
    if (backLeg) fUp = shiftPixels(base, fUp, backLeg.pixels, -1, 1); // Pushing forward

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
    
    const upperBodyPixels = [
      ...(head?.pixels || []),
      ...(torso?.pixels || []),
      ...(arm_left?.pixels || []),
      ...(arm_right?.pixels || [])
    ];
    
    const movingParts = [
      ...upperBodyPixels,
      ...(leg_left?.pixels || []),
      ...(leg_right?.pixels || [])
    ];

    // 1. CONTACT: High stride. 2px offset.
    let f1 = clearPixels(cloneFrame(base), movingParts);
    f1 = shiftPixels(base, f1, upperBodyPixels, 0, 0);
    if (leadLeg) f1 = stretchPixels(base, f1, leadLeg.pixels, 2); 
    if (backLeg) f1 = stretchPixels(base, f1, backLeg.pixels, -1);
    if (leadArm) f1 = stretchPixels(base, f1, leadArm.pixels, 1); 
    if (backArm) f1 = stretchPixels(base, f1, backArm.pixels, -1);
    
    // 2. DOWN: Weight impact.
    let f2 = clearPixels(cloneFrame(base), movingParts);
    f2 = shiftPixels(base, f2, upperBodyPixels, 1, 0);
    if (leg_left) f2 = shiftPixels(base, f2, leg_left.pixels, 0, 0);
    if (leg_right) f2 = shiftPixels(base, f2, leg_right.pixels, 0, 0);
    
    // 3. PASSING: Lifting one leg.
    let f3 = clearPixels(cloneFrame(base), movingParts);
    f3 = shiftPixels(base, f3, upperBodyPixels, 0, 0);
    if (backLeg) f3 = stretchPixels(base, f3, backLeg.pixels, -2); 
    if (leadLeg) f3 = shiftPixels(base, f3, leadLeg.pixels, 0, 0);
    
    // 4. UP: High point.
    let f4 = clearPixels(cloneFrame(base), movingParts);
    f4 = shiftPixels(base, f4, upperBodyPixels, -1, 0);
    f4 = stretchPixels(base, f4, torso?.pixels || [], -1);
    if (leg_left) f4 = shiftPixels(base, f4, leg_left.pixels, 0, 0);
    if (leg_right) f4 = shiftPixels(base, f4, leg_right.pixels, 0, 0);
    
    return [f1, f2, f3, f4];
  };

  return [...createStep(true), ...createStep(false)];
}
