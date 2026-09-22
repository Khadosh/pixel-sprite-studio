import { corsHeaders } from "./cors.ts";

export const GENERIC_SERVER_ERROR = "Error interno del servidor. Intenta de nuevo más tarde.";
export const CONFIG_ERROR = "Error de configuración del servidor.";
export const MAX_BODY_BYTES = 8 * 1024 * 1024;

/**
 * Error con código HTTP cuyo `message` es seguro de mostrar al cliente.
 * Los detalles internos van en `cause` y SOLO se registran en el log.
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
  }
}

export function jsonResponse(status: number, body: unknown, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

/**
 * Convierte cualquier error en una respuesta JSON `{ error }` sin filtrar
 * detalles internos: los HttpError exponen su mensaje (ya pensado para el
 * usuario) y todo lo demás se loguea con console.error y sale como 500 genérico.
 */
export function errorResponse(err: unknown, tag: string, req?: Request): Response {
  if (err instanceof HttpError) {
    if (err.status >= 500 || err.cause !== undefined) {
      console.error(`[${tag}] ${err.status} ${err.message}`, err.cause ?? "");
    }
    return jsonResponse(err.status, { error: err.message }, req);
  }
  console.error(`[${tag}] error inesperado:`, err);
  return jsonResponse(500, { error: GENERIC_SERVER_ERROR }, req);
}

/** Lee una variable de entorno obligatoria; si falta lanza 500 (sin exponer el nombre al cliente). */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(500, CONFIG_ERROR, { cause: `${name} no está configurada` });
  return value;
}

/** Lee y parsea el body JSON acotando su tamaño. Lanza 400/413 según corresponda. */
export async function readJsonBody(req: Request, maxBytes: number = MAX_BODY_BYTES): Promise<Record<string, unknown>> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, "El cuerpo de la petición es demasiado grande.");
  }
  let text: string;
  try {
    text = await req.text();
  } catch (cause) {
    throw new HttpError(400, "No se pudo leer el cuerpo de la petición.", { cause });
  }
  if (text.length > maxBytes) throw new HttpError(413, "El cuerpo de la petición es demasiado grande.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpError(400, "El cuerpo de la petición debe ser JSON válido.");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError(400, "El cuerpo de la petición debe ser un objeto JSON.");
  }
  return parsed as Record<string, unknown>;
}
