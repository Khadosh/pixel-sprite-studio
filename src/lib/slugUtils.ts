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
    .replace(/--+/g, '-');
}

/**
 * Crea un "spec" que combina el ID y el slug para la URL.
 * Formato: uuid-slug
 */
export function createSpec(id: string, name: string): string {
  if (!id) return '';
  const slug = slugify(name);
  return slug ? `${id}-${slug}` : id;
}

/**
 * Extrae el ID original de un spec de URL.
 */
export function parseSpec(spec: string): string {
  if (!spec) return '';
  // El ID es un UUID (36 chars), pero por seguridad tomamos la parte antes del primer guión largo
  // o simplemente buscamos un patrón de UUID al inicio.
  const match = spec.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : spec;
}
