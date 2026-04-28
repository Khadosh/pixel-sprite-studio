import type { Frame, AnatomyConfig } from '../../types';
import { animate_body } from './animate_body';

/** 
 * Idle: Ciclo de respiración mejorado con movimiento de rodillas y extremidades.
 * Utiliza la API Humana Builder para un código limpio y conciso.
 */
export function generateIdle(
  base: Frame, 
  anatomy?: AnatomyConfig,
  orientation: number = 0
): Frame[] {
  // --- FRAME 0: Neutral ---
  // Un build sin transformaciones dibujará todo en su posición original
  const f0 = animate_body(base, anatomy, orientation).build();

  // --- FRAME 1: Inhalación (Pecho sube, cabeza sube, brazos se encogen) ---
  const f1 = animate_body(base, anatomy, orientation)
    .expandir('torso', -1) // Pecho se infla hacia arriba
    .desplazar('head', -1, 0) // Cabeza acompaña al pecho
    .colapsar(['arm_left', 'arm_right'], 2, 'top') // Brazos se encogen desde el hombro
    .build();

  // --- FRAME 2: Exhalación y flexión (Settle / Squash) ---
  const f2 = animate_body(base, anatomy, orientation)
    .colapsar(['leg_left', 'leg_right'], 1, 'bottom') // Flexión de rodillas (squash)
    .desplazar(['torso', 'head', 'arm_left', 'arm_right'], 1, 0) // Todo el tren superior baja con la cintura
    .expandir(['arm_left', 'arm_right'], 1) // Brazos se relajan/estiran hacia el piso
    .build();

  // Secuencia: Neutral -> Inhala -> Neutral -> Exhala
  return [f0, f1, f0, f2];
}
