import { HttpError } from "./http.ts";

export const ALLOWED_SIZES = [16, 32, 64, 128] as const;
export type SpriteSize = (typeof ALLOWED_SIZES)[number];

export const MAX_PROMPT_LENGTH = 300;
export const MAX_ANIMATION_NAME_LENGTH = 40;
export const MAX_PALETTE_ENTRIES = 64;
export const MAX_COLOR_NAME_LENGTH = 40;
export const MAX_IMAGE_URL_LENGTH = 2048;
/** Las imágenes de referencia llegan como data URL base64 generadas en el cliente (FileReader / canvas). */
export const MAX_DATA_URL_LENGTH = 6 * 1024 * 1024;

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const ANIMATION_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;
const DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;
const PALETTE_KEY_RE = /^\d{1,4}$/;
const CONFIG_VALUE_RE = /^[A-Za-z0-9][A-Za-z0-9 _-]{0,23}$/;
// Caracteres de control ASCII (salvo \t \n \r) y DEL.
// deno-lint-ignore no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const bad = (message: string) => new HttpError(400, message);

function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS_RE, "");
}

/** `size` opcional: debe ser uno de ALLOWED_SIZES; si falta se usa `fallback`. */
export function validateSize(value: unknown, fallback: SpriteSize): SpriteSize {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !(ALLOWED_SIZES as readonly number[]).includes(value)) {
    throw bad(`El tamaño debe ser uno de: ${ALLOWED_SIZES.join(", ")}.`);
  }
  return value as SpriteSize;
}

/** `prompt`: string sin caracteres de control, recortado a `maxLength` (300 por defecto). */
export function validatePrompt(
  value: unknown,
  options: { required?: boolean; maxLength?: number } = {},
): string {
  const { required = true, maxLength = MAX_PROMPT_LENGTH } = options;
  if (value === undefined || value === null || value === "") {
    if (required) throw bad("Se requiere un prompt de texto.");
    return "";
  }
  if (typeof value !== "string") throw bad("El prompt debe ser un texto.");
  const cleaned = stripControlChars(value).trim().slice(0, maxLength).trim();
  if (required && cleaned.length === 0) throw bad("Se requiere un prompt de texto.");
  return cleaned;
}

/** `animationName`: 1..40 caracteres alfanuméricos (se admiten espacio, guion y guion bajo). */
export function validateAnimationName(value: unknown): string {
  if (typeof value !== "string") throw bad("Se requiere el nombre de la animación.");
  const name = value.trim();
  if (name.length === 0 || name.length > MAX_ANIMATION_NAME_LENGTH) {
    throw bad(`El nombre de la animación debe tener entre 1 y ${MAX_ANIMATION_NAME_LENGTH} caracteres.`);
  }
  if (!ANIMATION_NAME_RE.test(name)) {
    throw bad("El nombre de la animación solo admite letras, números, espacios, guiones y guiones bajos.");
  }
  return name;
}

/** Comprobación pura: matriz size×size de enteros >= 0. Reutilizable para validar salidas del modelo. */
export function isFrameMatrix(value: unknown, size: number): value is number[][] {
  if (!Array.isArray(value) || value.length !== size) return false;
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== size) return false;
    for (const px of row) {
      if (typeof px !== "number" || !Number.isSafeInteger(px) || px < 0) return false;
    }
  }
  return true;
}

export function frameHasPixels(frame: number[][]): boolean {
  return frame.some((row) => row.some((px) => px !== 0));
}

/** `baseFrame`: matriz size×size de enteros >= 0 (0 = transparente). */
export function validateBaseFrame(value: unknown, size: number): number[][] {
  if (!isFrameMatrix(value, size)) {
    throw bad(`El frame base debe ser una matriz de ${size}x${size} con enteros mayores o iguales a 0.`);
  }
  return value;
}

/**
 * `image_url`: URL https o data URL de imagen en base64 (el cliente manda
 * el canvas / archivo subido como data URL). Devuelve null si no viene y no es obligatoria.
 */
export function validateImageUrl(value: unknown, options: { required?: boolean } = {}): string | null {
  if (value === undefined || value === null || value === "") {
    if (options.required) throw bad("Se requiere la URL de la imagen de referencia.");
    return null;
  }
  if (typeof value !== "string") throw bad("La URL de la imagen no es válida.");

  if (value.startsWith("data:")) {
    if (value.length > MAX_DATA_URL_LENGTH) throw bad("La imagen de referencia es demasiado grande.");
    if (!DATA_IMAGE_RE.test(value)) throw bad("La imagen de referencia debe ser un data URL de imagen en base64.");
    return value;
  }

  if (value.length > MAX_IMAGE_URL_LENGTH) throw bad("La URL de la imagen no es válida.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw bad("La URL de la imagen no es válida.");
  }
  if (url.protocol !== "https:") throw bad("La URL de la imagen debe usar https.");
  if (url.username || url.password) throw bad("La URL de la imagen no es válida.");
  return url.href;
}

/**
 * `palette` opcional: objeto índice → hex (formato del cliente) o array de hex.
 * Devuelve un objeto normalizado sin la entrada "transparent", con hasta 64 colores.
 */
export function validatePalette(value: unknown): Record<string, string> | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object") throw bad("La paleta debe ser un objeto o un arreglo de colores.");

  const entries: [string, unknown][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_PALETTE_ENTRIES) throw bad(`La paleta admite hasta ${MAX_PALETTE_ENTRIES} colores.`);

  const out: Record<string, string> = {};
  for (const [key, raw] of entries) {
    if (!PALETTE_KEY_RE.test(key)) throw bad("Las claves de la paleta deben ser índices numéricos.");
    if (typeof raw !== "string") throw bad("Los colores de la paleta deben ser textos hexadecimales.");
    const color = raw.trim();
    if (color.toLowerCase() === "transparent") continue;
    if (!HEX_COLOR_RE.test(color)) throw bad("La paleta solo admite colores hexadecimales (#rrggbb).");
    out[key] = color;
  }
  return out;
}

/** `colorNames` opcional (contexto para el modelo): se conservan solo valores string, recortados. */
export function validateColorNames(value: unknown): Record<string, string> {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw bad("colorNames debe ser un objeto.");
  const out: Record<string, string> = {};
  let count = 0;
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!PALETTE_KEY_RE.test(key) || typeof raw !== "string") continue;
    if (++count > MAX_PALETTE_ENTRIES) break;
    out[key] = stripControlChars(raw).trim().slice(0, MAX_COLOR_NAME_LENGTH);
  }
  return out;
}

export interface SafeProjectConfig {
  directionality?: string;
  aesthetics?: string;
}

/** `projectConfig` opcional: solo se conservan valores cortos y alfanuméricos (se interpolan en prompts). */
export function validateProjectConfig(value: unknown): SafeProjectConfig {
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw bad("projectConfig debe ser un objeto.");
  const input = value as Record<string, unknown>;
  const out: SafeProjectConfig = {};
  for (const key of ["directionality", "aesthetics"] as const) {
    const raw = input[key];
    if (typeof raw === "string" && CONFIG_VALUE_RE.test(raw.trim())) out[key] = raw.trim();
  }
  return out;
}
