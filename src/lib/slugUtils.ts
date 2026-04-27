/**
 * Convierte un nombre en un slug amigable para URLs.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Quita acentos
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Crea un "spec" que es simplemente el slug del nombre.
 * Si el nombre está vacío, se marcará como "temp" (el ID real se usará como sufijo si es necesario).
 */
export function createSpec(id: string, name: string): string {
  if (!name || name.trim() === '' || name.toLowerCase() === 'new sprite') {
    const suffix = id ? id.substring(0, 8) : Math.random().toString(36).substring(2, 10);
    return `temp-${suffix}`;
  }
  return slugify(name);
}

/**
 * Extrae el identificador de un spec de URL.
 * Puede ser un UUID (formato antiguo o directo) o un slug limpio.
 */
export function parseSpec(spec: string): string {
  if (!spec) return '';
  
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  
  // Intentar encontrar el UUID al final (formato antiguo slug-uuid)
  const endMatch = spec.match(new RegExp(`${uuidPattern.source}$`, 'i'));
  if (endMatch) return endMatch[0];
  
  // Intentar encontrar el UUID al inicio (formato antiguo uuid-slug)
  const startMatch = spec.match(new RegExp(`^${uuidPattern.source}`, 'i'));
  if (startMatch) return startMatch[0];
  
  // Si no hay UUID, el spec es el slug directamente
  return spec;
}
