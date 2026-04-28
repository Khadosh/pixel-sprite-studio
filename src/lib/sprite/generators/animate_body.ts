import type { Frame, AnatomyConfig, MemberType } from '../../types';
import { resolveMembers } from '../anatomyResolver';
import * as transformations from '../anatomyTransforms';

export const animate_body = (base: Frame, anatomy?: AnatomyConfig, orientation: number = 0) => {
  const members = resolveMembers(base, anatomy, orientation);
  
  const todosLosPixeles = [
    ...(members.torso?.pixels || []),
    ...(members.head?.pixels || []),
    ...(members.arm_left?.pixels || []),
    ...(members.arm_right?.pixels || []),
    ...(members.leg_left?.pixels || []),
    ...(members.leg_right?.pixels || [])
  ];

  // Empezamos con un lienzo en blanco (solo el fondo/objetos estáticos)
  let frame = transformations.limpiarPixels(transformations.clonarFrame(base), todosLosPixeles);
  
  const builder = {
    _transformed: new Set<MemberType>(),

    _markTransformed: (parts: MemberType | MemberType[]) => {
      const arr = Array.isArray(parts) ? parts : [parts];
      arr.forEach(p => builder._transformed.add(p));
    },

    desplazar: (body_part: MemberType | MemberType[], dr: number, dc: number) => {
      builder._markTransformed(body_part);
      const parts = Array.isArray(body_part) ? body_part : [body_part];
      parts.forEach(part => {
        if (members[part]) {
          frame = transformations.desplazarPixels(base, frame, members[part].pixels, dr, dc);
        }
      });
      return builder;
    },

    expandir: (body_part: MemberType | MemberType[], dr: number) => {
      builder._markTransformed(body_part);
      const parts = Array.isArray(body_part) ? body_part : [body_part];
      parts.forEach(part => {
        if (members[part]) {
          frame = transformations.expandirPixels(base, frame, members[part].pixels, dr);
        }
      });
      return builder;
    },

    colapsar: (body_part: MemberType | MemberType[], dr: number, pivotSide: 'top' | 'bottom' = 'bottom') => {
      builder._markTransformed(body_part);
      const parts = Array.isArray(body_part) ? body_part : [body_part];
      parts.forEach(part => {
        if (members[part]) {
          frame = transformations.colapsarPixels(base, frame, members[part].pixels, dr, pivotSide);
        }
      });
      return builder;
    },

    rotar: (body_part: MemberType | MemberType[], angleDeg: number, drOffset: number = 0, dcOffset: number = 0) => {
      builder._markTransformed(body_part);
      const parts = Array.isArray(body_part) ? body_part : [body_part];
      parts.forEach(part => {
        if (members[part]) {
          frame = transformations.rotarPixels(
            base, 
            frame, 
            members[part].pixels, 
            members[part].pivot, 
            angleDeg, 
            drOffset, 
            dcOffset
          );
        }
      });
      return builder;
    },

    // Retorna el resultado final, dibujando los miembros que no fueron transformados
    build: () => {
      const allTypes: MemberType[] = ['head', 'torso', 'arm_left', 'arm_right', 'leg_left', 'leg_right', 'tail', 'wing', 'prop'];
      allTypes.forEach(type => {
        if (!builder._transformed.has(type) && members[type]) {
          frame = transformations.desplazarPixels(base, frame, members[type].pixels, 0, 0);
        }
      });
      return frame;
    }
  };

  return builder;
}
