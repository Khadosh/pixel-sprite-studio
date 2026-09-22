/**
 * CORS compartido por todas las Edge Functions.
 *
 * `ALLOWED_ORIGIN` (env): lista separada por comas de orígenes permitidos,
 * p. ej. "https://app.midominio.com,http://localhost:8080".
 * Si no está definida se usa "*" para no romper el entorno local.
 */
const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";
const ALLOWED_METHODS = "POST, OPTIONS";

export function allowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGIN")?.trim();
  if (!raw) return ["*"];
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : ["*"];
}

/**
 * Elige el valor de Access-Control-Allow-Origin para una petición.
 * Si la lista contiene "*" se devuelve "*"; si el Origin de la petición está
 * en la lista se devuelve tal cual; en otro caso se devuelve el primer origen
 * configurado (el navegador bloqueará la respuesta, que es lo deseado).
 */
export function resolveOrigin(requestOrigin: string | null, origins: string[] = allowedOrigins()): string {
  if (origins.includes("*")) return "*";
  if (requestOrigin && origins.includes(requestOrigin)) return requestOrigin;
  return origins[0];
}

export function corsHeaders(req?: Request): Record<string, string> {
  const origin = resolveOrigin(req?.headers.get("Origin") ?? null);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
  };
  if (origin !== "*") headers["Vary"] = "Origin";
  return headers;
}

/** Responde el preflight OPTIONS; devuelve null si no es un preflight. */
export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  return new Response("ok", { status: 200, headers: corsHeaders(req) });
}
