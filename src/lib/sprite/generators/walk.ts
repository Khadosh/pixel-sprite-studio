import type { Frame, AnatomyConfig } from '../../types';
import { animate_body } from './animate_body';

/** 
 * Front/Back Walk: Dynamic 8-frame cycle using Anatomy Engine.
 * Follows Richard Williams' 4-step sequence: Contact, Down, Pass, Up.
 */
export function generateWalk(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const createStep = (isLeftLeading: boolean) => {
    // 1. CONTACT: Both feet down. Arms swinging opposite to legs.
    const fContact = animate_body(base, anatomy, orientation)
      .expandir('arm_left', isLeftLeading ? -1 : 1)
      .expandir('arm_right', isLeftLeading ? 1 : -1)
      .build();

    // 2. DOWN: Weight impact. Knees bend, body drops.
    const fDown = animate_body(base, anatomy, orientation)
      .colapsar(['leg_left', 'leg_right'], 1, 'bottom')
      .desplazar(['torso', 'head', 'arm_left', 'arm_right'], 1, 0)
      .build();

    // 3. PASSING: Lift passing leg, stand on one leg.
    const passingLeg = isLeftLeading ? 'leg_right' : 'leg_left';
    const fPass = animate_body(base, anatomy, orientation)
      .desplazar(passingLeg, -1, 0) // Levanta el pie
      .build();

    // 4. UP: Push off. Body rises.
    const fUp = animate_body(base, anatomy, orientation)
      .expandir('torso', -1) // Torso se estira hacia arriba
      .desplazar('head', -1, 0) // Cabeza sube
      // Brazos se quedan en 0 (simula la caída de hombros)
      .build();

    return [fContact, fDown, fPass, fUp];
  };

  return [...createStep(true), ...createStep(false)];
}

/** 
 * Side Walk: Horizontal scissors pattern.
 */
export function generateWalkSide(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 1
): Frame[] {
  const createStep = (isLeftForward: boolean) => {
    const forwardLeg = isLeftForward ? 'leg_left' : 'leg_right';
    const backLeg = isLeftForward ? 'leg_right' : 'leg_left';
    const forwardArm = isLeftForward ? 'arm_right' : 'arm_left'; // Opuesto a la pierna
    const backArm = isLeftForward ? 'arm_left' : 'arm_right';
    
    // 1. CONTACT: Both feet separated on floor (X-offset)
    const fContact = animate_body(base, anatomy, orientation)
      .desplazar(forwardLeg, 0, 1)
      .desplazar(backLeg, 0, -1)
      .desplazar(forwardArm, 0, 1)
      .desplazar(backArm, 0, -1)
      .build();
    
    // 2. DOWN: Weight impact
    const fDown = animate_body(base, anatomy, orientation)
      .desplazar(forwardLeg, 0, 1)
      .desplazar(backLeg, 0, -1)
      .desplazar(['torso', 'head'], 1, 0) // Torso baja 1px (overlap con piernas)
      .desplazar(forwardArm, 1, 1)
      .desplazar(backArm, 1, -1)
      .build();
    
    // 3. PASS POS: Legs crossing, passing leg lifts
    const fPass = animate_body(base, anatomy, orientation)
      .desplazar(backLeg, -1, 0) // Pierna de atrás pasa al frente y sube
      .build();
    
    // 4. UP: Push off (Estiramiento)
    const fUp = animate_body(base, anatomy, orientation)
      .desplazar(backLeg, -1, 1) // Pierna preparándose para aterrizar
      .expandir('torso', -1) // Torso se estira hacia arriba
      .desplazar('head', -1, 0)
      .build();

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
  const createStep = (isLeftLeading: boolean) => {
    const leadArm = isLeftLeading ? 'arm_right' : 'arm_left';
    const backArm = isLeftLeading ? 'arm_left' : 'arm_right';
    const leadLeg = isLeftLeading ? 'leg_left' : 'leg_right';
    const backLeg = isLeftLeading ? 'leg_right' : 'leg_left';
    
    // 1. CONTACT: High stride. Y offset.
    const f1 = animate_body(base, anatomy, orientation)
      .expandir(leadLeg, 2)
      .expandir(backLeg, -1)
      .expandir(leadArm, 1)
      .expandir(backArm, -1)
      .build();
    
    // 2. DOWN: Weight impact.
    const f2 = animate_body(base, anatomy, orientation)
      .desplazar(['torso', 'head', leadArm, backArm], 1, 0)
      .expandir(leadLeg, 2)
      .expandir(backLeg, -1)
      .build();
    
    // 3. PASSING: Lifting one leg.
    const f3 = animate_body(base, anatomy, orientation)
      .expandir(backLeg, -2)
      .build();
    
    // 4. UP: High point.
    const f4 = animate_body(base, anatomy, orientation)
      .expandir('torso', -1)
      .desplazar('head', -1, 0)
      .build();
    
    return [f1, f2, f3, f4];
  };

  return [...createStep(true), ...createStep(false)];
}

