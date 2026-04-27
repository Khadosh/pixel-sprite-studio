import type { Frame, AnatomyConfig } from '../../types';
import { 
  clonarFrame, 
  desplazarPixels, 
  expandirPixels, 
  colapsarPixels, 
  rotarPixels, 
  limpiarPixels 
} from '../anatomyTransforms';
import { resolveMembers } from '../anatomyResolver';

/** 
 * Idle: Ciclo de respiración mejorado con movimiento de rodillas y extremidades.
 * Utiliza la API Humana para facilitar la comprensión de los movimientos.
 */
export function generateIdle(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  const members = resolveMembers(base, anatomy, orientation);
  const { head, torso, arm_left, arm_right, leg_left, leg_right } = members;

  // Definimos los grupos que se mueven juntos
  const extremidadesSuperiores = [
    ...(head?.pixels || []),
    ...(arm_left?.pixels || []),
    ...(arm_right?.pixels || [])
  ];
  
  const torsoPixels = torso?.pixels || [];
  const piernas = [
    ...(leg_left?.pixels || []),
    ...(leg_right?.pixels || [])
  ];

  const todosLosPixelesMoviles = [
    ...torsoPixels,
    ...extremidadesSuperiores,
    ...piernas
  ];

  // --- FRAME 0: Neutral ---
  const f0 = clonarFrame(base);

  // --- FRAME 1: Inhalación (Pecho sube, cabeza sube, hombros rotan) ---
  let f1 = limpiarPixels(clonarFrame(base), todosLosPixelesMoviles);
  
  // 1. Piernas se mantienen firmes en la inhalación
  if (piernas.length > 0) {
    f1 = desplazarPixels(base, f1, piernas, 0, 0);
  }
  
  // 2. El torso se expande hacia arriba (pecho inflado)
  if (torsoPixels.length > 0) {
    f1 = expandirPixels(base, f1, torsoPixels, -1);
  }
  
  // 3. Cabeza sube con el pecho
  if (head?.pixels?.length) {
    f1 = desplazarPixels(base, f1, head.pixels, -1, 0);
  }
  
  // 4. Brazos suben Y rotan hacia afuera
  if (arm_left?.pixels?.length) {
    // f1 = desplazarPixels(base, f1, arm_right.pixels, -1, 0)
    f1 = colapsarPixels(base, f1, arm_right.pixels, 2, 'top')
  }
  if (arm_right?.pixels?.length) {
    // f1 = desplazarPixels(base, f1, arm_left.pixels, -1, 0)
    f1 = colapsarPixels(base, f1, arm_left.pixels, 2, 'top')
  }

  // --- FRAME 2: Exhalación y flexión (Settle) ---
  let f2 = limpiarPixels(clonarFrame(base), todosLosPixelesMoviles);
  
  // 1. Las piernas se colapsan (flexión de rodillas, la cintura baja 1px)
  if (piernas.length > 0) {
    f2 = colapsarPixels(base, f2, piernas, 1, 'bottom');
  }
  
  // 2. Torso baja 1px para seguir a la cintura (acompaña la flexión)
  if (torsoPixels.length > 0) {
    f2 = desplazarPixels(base, f2, torsoPixels, 1, 0);
  }
  
  // 3. Cabeza baja acompañando al torso
  if (head?.pixels?.length) {
    f2 = desplazarPixels(base, f2, head.pixels, 1, 0);
  }
  
  // 4. Brazos bajan
  if (arm_left?.pixels?.length) {
    f2 = desplazarPixels(base, f2, arm_left.pixels, 1, 0);
    f2 = expandirPixels(base, f2, arm_left.pixels, 1);
  }
  if (arm_right?.pixels?.length) {
    f2 = desplazarPixels(base, f2, arm_right.pixels, 1, 0);
    f2 = expandirPixels(base, f2, arm_right.pixels, 1);
  }

  // Secuencia: Neutral -> Inhala -> Neutral -> Exhala
  return [f0, f1, f0, f2];
}
