import type { Frame, AnatomyConfig, MemberType } from '../../types';
import { animate_body } from './animate_body';

/** 
 * Jump: 4-frame sequence using Anatomy Engine.
 * 1. Anticipation (Squash), 2. Mid-air (Stretch), 3. Landing (Squash), 4. Recovery.
 */
export function generateJump(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  // 1. ANTICIPATION (Squat / Squash)
  const f0 = animate_body(base, anatomy, orientation)
    .colapsar(['leg_left', 'leg_right'], 1, 'bottom') // Rodillas flexionan
    .desplazar(['torso', 'head', 'arm_left', 'arm_right'], 1, 0) // Cuerpo baja
    .build();

  // 2. MID-AIR (Stretch + Rise)
  const allMembers: MemberType[] = ['head', 'torso', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 'tail', 'wing', 'prop'];
  const f1 = animate_body(base, anatomy, orientation)
    .expandir('torso', -1) // Cuerpo se estira hacia arriba
    .desplazar(allMembers, -3, 0) // TODO el personaje salta 3px hacia arriba (dejando sombras estáticas atrás si las hubiera)
    .colapsar(['arm_left', 'arm_right'], 2, 'top') // Brazos suben por la inercia del salto
    .colapsar(['leg_left', 'leg_right'], 1, 'bottom') // Piernas se encogen en el aire
    .build();

  // 3. LANDING (Impact)
  // Reutilizamos el frame de anticipación
  const f2 = f0;

  // 4. RECOVERY
  const f3 = animate_body(base, anatomy, orientation).build();

  return [f0, f1, f2, f3];
}

/**
 * Run: Faster walk cycle (8 frames) with aggressive limb movement and an airborne suspension phase.
 */
export function generateRun(
  base: Frame,
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const createStep = (isLeftLeading: boolean) => {
    const leadLeg = isLeftLeading ? 'leg_left' : 'leg_right';
    const backLeg = isLeftLeading ? 'leg_right' : 'leg_left';
    const leadArm = isLeftLeading ? 'arm_right' : 'arm_left'; // Opuesto a la pierna
    const backArm = isLeftLeading ? 'arm_left' : 'arm_right';

    // 1. CONTACT: Extended stride, arms pumping
    const fContact = animate_body(base, anatomy, orientation)
      .expandir(leadLeg, 1) // Pierna delantera extendida
      .expandir(backLeg, -1) // Pierna trasera recogida
      .expandir(leadArm, -1) // Brazo delantero doblado hacia arriba
      .expandir(backArm, 1) // Brazo trasero extendido hacia atrás
      .build();

    // 2. DOWN (Squash): Heavy weight impact
    const fDown = animate_body(base, anatomy, orientation)
      .colapsar([leadLeg, backLeg], 1, 'bottom') // Rodillas flexionan
      .desplazar(['torso', 'head', 'arm_left', 'arm_right'], 1, 0) // Tren superior baja
      .expandir(leadArm, -1)
      .expandir(backArm, 1)
      .build();

    // 3. PASS / PUSH-OFF: Explosive upward movement
    const fPass = animate_body(base, anatomy, orientation)
      .desplazar(backLeg, -1, 0) // Pierna trasera sube
      .build();

    // 4. SUSPENSION (Airborne): Both feet off ground!
    const allMembers: MemberType[] = ['head', 'torso', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 'tail', 'wing', 'prop'];
    const fUp = animate_body(base, anatomy, orientation)
      .desplazar(allMembers, -1, 0) // Todo el cuerpo salta 1 px hacia arriba
      .expandir(leadLeg, -1) // Piernas encogidas en el aire preparándose para aterrizar
      .expandir(backLeg, -1)
      .build();

    return [fContact, fDown, fPass, fUp];
  };

  return [...createStep(true), ...createStep(false)];
}
