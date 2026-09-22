/** FNV-1a de 32 bits sobre un string. Rápido y suficiente para detectar cambios de contenido. */
export function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Huella del asset con el que se abrió el editor. Se guarda junto al snapshot local
 * para descartarlo si el sprite cambió en la DB desde que se creó el borrador.
 */
export function hashAssetSource(asset: unknown): string {
  return fnv1a(JSON.stringify(asset));
}
